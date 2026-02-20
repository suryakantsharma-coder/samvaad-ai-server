/**
 * Gemini Realtime Voice Agent
 * Uses Google Gemini Live API (WebSocket) with Exotel.
 * - Human detection: once at call start (after first user speech).
 * - Hindi/Gujarati detection: once from first user message, then locked for the call.
 * - Same hospital/patient/appointment flow and tools as OpenAI agent.
 *
 * Exotel protocol: event "start" | "media" | "stop".
 * Transcript-only: Exotel 8kHz -> resample to 24kHz -> Whisper -> text -> Gemini Live; Gemini 24kHz audio out -> resample to 8kHz -> Exotel.
 * Env: GEMINI_API_KEY (required), OPENAI_API_KEY (for Whisper).
 */

const WebSocket = require('ws');
const mongoose = require('mongoose');
require('dotenv').config();
const HospitalModel = require('../models/hospital.model');
const DoctorModel = require('../models/doctor.model');
const PatientModel = require('../models/patient.model');
const AppointmentModel = require('../models/appointment.model');
const { getHospitalInstructions } = require('./hospitalInstructions');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // for Whisper transcription
const GEMINI_LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

const EXOTEL_SAMPLE_RATE = 8000;
const EXOTEL_SAMPLE_WIDTH = 2;
const EXOTEL_CHUNK_MS = 20;
const EXOTEL_CHUNK_BYTES = ((EXOTEL_SAMPLE_RATE * EXOTEL_CHUNK_MS) / 1000) * EXOTEL_SAMPLE_WIDTH;
const GEMINI_OUTPUT_SAMPLE_RATE = 24000;
const BOT_OUTBOUND_BUFFER_MS = 200;
const BOT_OUTBOUND_BUFFER_CHUNKS = Math.max(1, Math.ceil(BOT_OUTBOUND_BUFFER_MS / EXOTEL_CHUNK_MS));

const TRANSCRIPT_ONLY_SILENCE_MS = 900;
const TRANSCRIPT_ONLY_SPEECH_THRESHOLD = 300;
const TRANSCRIPT_ONLY_MIN_DURATION_MS = 400;

const RESAMPLE_UP_TO_24K = 24000 / EXOTEL_SAMPLE_RATE;
const RESAMPLE_DOWN = EXOTEL_SAMPLE_RATE / GEMINI_OUTPUT_SAMPLE_RATE;

function resample8kTo24k(pcm8k) {
  const numSamples8k = pcm8k.length / 2;
  const numSamples24k = Math.floor(numSamples8k * RESAMPLE_UP_TO_24K);
  const out = Buffer.alloc(numSamples24k * 2);
  for (let i = 0; i < numSamples24k; i++) {
    const srcIdx = i / RESAMPLE_UP_TO_24K;
    const i0 = Math.floor(srcIdx);
    const i1 = Math.min(i0 + 1, numSamples8k - 1);
    const frac = srcIdx - i0;
    const s0 = pcm8k.readInt16LE(i0 * 2);
    const s1 = pcm8k.readInt16LE(i1 * 2);
    const sample = Math.round(s0 + frac * (s1 - s0));
    out.writeInt16LE(sample, i * 2);
  }
  return out;
}

function resample24kTo8k(pcm24k) {
  const numSamples24k = pcm24k.length / 2;
  const numSamples8k = Math.floor(numSamples24k * RESAMPLE_DOWN);
  const out = Buffer.alloc(numSamples8k * 2);
  const ratio = GEMINI_OUTPUT_SAMPLE_RATE / EXOTEL_SAMPLE_RATE;
  for (let i = 0; i < numSamples8k; i++) {
    const srcIdx = i * ratio;
    const idx = Math.min(Math.floor(srcIdx), numSamples24k - 1);
    const sample = pcm24k.readInt16LE(idx * 2);
    out.writeInt16LE(sample, i * 2);
  }
  return out;
}

function computeRms(pcmBuffer) {
  let sum = 0;
  const n = pcmBuffer.length / 2;
  for (let i = 0; i < n; i++) {
    const s = pcmBuffer.readInt16LE(i * 2);
    sum += s * s;
  }
  return n > 0 ? Math.sqrt(sum / n) : 0;
}

function pcm24kToWavBuffer(pcm24k) {
  const numSamples = pcm24k.length / 2;
  const dataSize = numSamples * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24000, 24);
  header.writeUInt32LE(48000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm24k]);
}

async function transcribeWithWhisper(wavBuffer) {
  const { Readable } = require('stream');
  const stream = Readable.from(wavBuffer);
  stream.path = 'audio.wav';
  const chatgpt = require('openai');
  const openai = new chatgpt({ apiKey: OPENAI_API_KEY });
  const transcription = await openai.audio.transcriptions.create({
    file: stream,
    model: 'whisper-1',
    language: 'hi',
    prompt:
      'Indian names, first name and last name. Hospital appointment, patient. Medical: piles, bavasir, बवासीर, pain, dard, pet dard, fever, bukhar, doctor, date, time.',
  });
  return transcription.text ? transcription.text.trim() : '';
}

/** One-time Hindi vs Gujarati detection from first user text. Returns 'GU' or 'HI'. */
function detectCallerLanguage(text) {
  if (!text || typeof text !== 'string') return 'HI';
  const t = text.trim();
  const gujaratiRange = /[\u0A80-\u0AFF]/;
  const gujaratiWords = /\b(આવ્યા|છો|છે|જણાવશો|ઉંમર|ફોન|તારીખ|સમય|નામ|બવાસીર|દર્દ|બુખાર)\b/;
  if (gujaratiRange.test(t) || gujaratiWords.test(t)) return 'GU';
  return 'HI';
}

/** Build Gemini-style tools from our function definitions. */
function buildGeminiTools() {
  return [
    {
      name: 'fetch_patient_by_patientId',
      description:
        'Find the patient using patientId (e.g. P-2026-000001) for the current hospital. Returns the patient record including _id; use that _id as patientObjectId when calling create_appointment.',
      parameters: {
        type: 'object',
        properties: { patientId: { type: 'string', description: 'Patient ID like P-2026-000001' } },
        required: ['patientId'],
      },
    },
    {
      name: 'create_patient',
      description:
        'Create a new patient for the current hospital and return patientId + details including _id. Use the returned _id when linking to an appointment via create_appointment.',
      parameters: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          age: { type: 'number' },
          gender: { type: 'string', enum: ['Male', 'Female', 'Other'] },
          phoneNumber: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['fullName', 'age', 'gender', 'reason'],
      },
    },
    {
      name: 'list_doctors',
      description:
        "List ALL doctors for the current hospital. Pick the doctor whose designation matches the patient's illness, then use that doctor's _id as doctorObjectId in create_appointment.",
      parameters: { type: 'object', properties: {} },
    },
    {
      name: 'search_doctors',
      description: 'Search doctors by name or designation within the current hospital.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' }, limit: { type: 'number' } },
        required: ['query'],
      },
    },
    {
      name: 'create_appointment',
      description:
        'Create an appointment linking patient and doctor by their database _id. reason must be the illness the caller stated during this call.',
      parameters: {
        type: 'object',
        properties: {
          doctorObjectId: { type: 'string' },
          patientObjectId: { type: 'string' },
          reason: { type: 'string' },
          appointmentDateTimeISO: { type: 'string' },
          type: { type: 'string' },
        },
        required: ['doctorObjectId', 'patientObjectId', 'reason', 'appointmentDateTimeISO'],
      },
    },
  ];
}

/**
 * Attach Gemini realtime WebSocket route to the given Express app.
 * Route: /media-gemini/:hospitalId
 * Requires: GEMINI_API_KEY, OPENAI_API_KEY (for Whisper) in env.
 */
function attachGeminiRoutes(app) {
  if (!app) return;

  app.ws('/media-gemini/:hospitalId', async (ws, req) => {
    const { hospitalId } = req.params;

    if (!mongoose.isValidObjectId(hospitalId)) {
      console.error(`[Gemini/Exotel] Invalid hospitalId: ${hospitalId}`);
      ws.close(1008, 'Invalid hospital ID');
      return;
    }

    let hospital;
    try {
      hospital = await HospitalModel.findById(hospitalId).lean();
      if (!hospital) {
        ws.close(1008, 'Hospital not found');
        return;
      }
      console.log(
        `[Gemini/Exotel] WebSocket connected for hospital: ${hospital.name} (${hospitalId})`,
      );
    } catch (err) {
      console.error('[Gemini] Error fetching hospital:', err.message);
      ws.close(1011, 'Server error');
      return;
    }

    let hospitalInstructions;
    try {
      hospitalInstructions = await getHospitalInstructions(hospital);
    } catch (err) {
      console.error('[Gemini] Error loading instructions:', err.message);
      hospitalInstructions = `You are ${hospital.name}'s Calling Assistant. Be helpful and book appointments.`;
    }

    const tools = buildGeminiTools();
    let streamSid = null;
    let callerPhone = null;
    let geminiWs = null;
    let geminiReady = false;
    const outboundBotBuffer = [];
    let userIsSpeaking = false;
    const callTranscript = [];

    // One-time detection (ek baar)
    let firstUserMessageReceived = false;
    let humanDetected = false;
    let callerLanguage = null;

    const transcriptOnlyState = {
      userChunks: [],
      lastSpeechAt: 0,
      silenceStartedAt: null,
      hadSpeechInTurn: false,
      cancelResponse: () => {},
      processing: false,
    };
    const MIN_SPEECH_BYTES_24K =
      (TRANSCRIPT_ONLY_MIN_DURATION_MS / 1000) * GEMINI_OUTPUT_SAMPLE_RATE * 2;

    const cleanupGemini = () => {
      if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
        try {
          geminiWs.close();
        } catch (e) {
          console.error('[Gemini] Error closing:', e);
        }
        geminiWs = null;
      }
    };

    const runTool = async (name, args, sendToolResponse) => {
      const hospitalObjectId = hospital._id;
      try {
        if (name === 'fetch_patient_by_patientId') {
          const patientId = String(args.patientId || '').trim();
          const patient = await PatientModel.findOne({
            patientId,
            hospital: hospitalObjectId,
          }).lean();
          if (!patient)
            return sendToolResponse({ ok: false, message: 'Patient not found for this hospital.' });
          return sendToolResponse({
            ok: true,
            patient: {
              _id: String(patient._id),
              patientId: patient.patientId,
              fullName: patient.fullName,
              age: patient.age,
              gender: patient.gender,
              phoneNumber: patient.phoneNumber,
              reason: patient.reason,
              hospital: String(patient.hospital || ''),
            },
          });
        }

        if (name === 'create_patient') {
          const fullName = String(args.fullName || '').trim();
          const age = Number(args.age);
          const gender = String(args.gender || '').trim();
          const reason = String(args.reason || '').trim();
          const argsPhone = String(args.phoneNumber || '').trim();
          const fromCall = callerPhone && callerPhone !== 'unknown' ? callerPhone : '';
          const phoneNumber =
            fromCall || (argsPhone && argsPhone.toLowerCase() !== 'not provided' ? argsPhone : '');
          if (!fullName || !Number.isFinite(age) || age < 0 || !phoneNumber || !reason)
            return sendToolResponse({ ok: false, message: 'Missing/invalid patient fields.' });
          const year = new Date().getFullYear();
          const prefix = `P-${year}-`;
          const last = await PatientModel.findOne({ patientId: new RegExp(`^${prefix}`) })
            .sort({ patientId: -1 })
            .select('patientId')
            .lean();
          const nextNum = last ? parseInt(String(last.patientId).slice(prefix.length), 10) + 1 : 1;
          const patientId = `${prefix}${String(nextNum).padStart(6, '0')}`;
          const patient = await PatientModel.create({
            hospital: hospitalObjectId,
            patientId,
            fullName,
            age,
            gender,
            phoneNumber,
            reason,
          });
          return sendToolResponse({
            ok: true,
            patient: {
              _id: String(patient._id),
              patientId: patient.patientId,
              fullName: patient.fullName,
              age: patient.age,
              gender: patient.gender,
              phoneNumber: patient.phoneNumber,
              reason: patient.reason,
              hospital: String(patient.hospital || ''),
            },
          });
        }

        if (name === 'list_doctors') {
          const doctors = await DoctorModel.find({ hospital: hospitalObjectId })
            .select('_id fullName doctorId designation availability status')
            .lean();
          const doctorsPayload = doctors.map((d) => ({
            _id: String(d._id),
            doctorId: d.doctorId || '',
            fullName: d.fullName,
            designation: d.designation,
            availability: d.availability,
            status: d.status,
          }));
          return sendToolResponse({
            ok: true,
            doctors: doctorsPayload,
            message: `List of ${doctors.length} doctor(s). Use doctor's _id as doctorObjectId in create_appointment.`,
          });
        }

        if (name === 'search_doctors') {
          const query = String(args.query || '').trim();
          const limit = Math.max(1, Math.min(20, Number(args.limit || 10)));
          if (!query)
            return sendToolResponse({
              ok: false,
              message: 'Query is required. Use list_doctors for full list.',
            });
          const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          const doctors = await DoctorModel.find({
            hospital: hospitalObjectId,
            $or: [{ fullName: regex }, { designation: regex }],
          })
            .select('_id fullName doctorId designation availability status')
            .limit(limit)
            .lean();
          const doctorsPayload = doctors.map((d) => ({
            _id: String(d._id),
            doctorId: d.doctorId || '',
            fullName: d.fullName,
            designation: d.designation,
            availability: d.availability,
            status: d.status,
          }));
          return sendToolResponse({ ok: true, doctors: doctorsPayload });
        }

        if (name === 'create_appointment') {
          const doctorObjectId = String(args.doctorObjectId || '').trim();
          const patientObjectId = String(args.patientObjectId || '').trim();
          const reason = String(args.reason || '').trim();
          const appointmentDateTimeISO = String(args.appointmentDateTimeISO || '').trim();
          const type = String(args.type || 'call').trim() || 'call';
          if (
            !mongoose.isValidObjectId(doctorObjectId) ||
            !mongoose.isValidObjectId(patientObjectId)
          )
            return sendToolResponse({ ok: false, message: 'Invalid doctor or patient id.' });
          const dt = new Date(appointmentDateTimeISO);
          if (Number.isNaN(dt.getTime()))
            return sendToolResponse({ ok: false, message: 'Invalid appointmentDateTimeISO.' });
          if (!reason) return sendToolResponse({ ok: false, message: 'Reason is required.' });
          const [doctor, patient] = await Promise.all([
            DoctorModel.findOne({ _id: doctorObjectId, hospital: hospitalObjectId }).lean(),
            PatientModel.findOne({ _id: patientObjectId, hospital: hospitalObjectId }).lean(),
          ]);
          if (!doctor)
            return sendToolResponse({ ok: false, message: 'Doctor not found for this hospital.' });
          if (!patient)
            return sendToolResponse({ ok: false, message: 'Patient not found for this hospital.' });
          const year = new Date().getFullYear();
          const prefix = `A-${year}-`;
          const last = await AppointmentModel.findOne({
            appointmentId: new RegExp(`^${prefix}`),
          })
            .sort({ appointmentId: -1 })
            .select('appointmentId')
            .lean();
          const nextNum = last
            ? parseInt(String(last.appointmentId).slice(prefix.length), 10) + 1
            : 1;
          const appointmentId = `${prefix}${String(nextNum).padStart(6, '0')}`;
          const appointment = await AppointmentModel.create({
            hospital: hospitalObjectId,
            appointmentId,
            patient: patientObjectId,
            doctor: doctorObjectId,
            reason,
            status: 'Upcoming',
            type,
            appointmentDateTime: dt,
          });
          return sendToolResponse({
            ok: true,
            appointment: {
              _id: String(appointment._id),
              appointmentId: appointment.appointmentId,
              hospital: String(appointment.hospital || ''),
              patient: String(appointment.patient),
              doctor: String(appointment.doctor),
              reason: appointment.reason,
              status: appointment.status,
              type: appointment.type,
              appointmentDateTime: appointment.appointmentDateTime?.toISOString?.() || null,
            },
          });
        }

        return sendToolResponse({ ok: false, message: `Unknown tool: ${name}` });
      } catch (err) {
        console.error('[Gemini] Tool error:', err.message);
        return sendToolResponse({ ok: false, message: err.message || 'Tool error' });
      }
    };

    const connectGeminiLive = () => {
      if (!GEMINI_API_KEY) {
        console.error('[Gemini] GEMINI_API_KEY not set');
        return null;
      }
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
      const client = new WebSocket(url);

      client.on('open', () => {
        console.log(
          `[Gemini] Live connected for hospital: ${hospital.name} (model: ${GEMINI_LIVE_MODEL})`,
        );
        const setup = {
          setup: {
            model: GEMINI_LIVE_MODEL,
            generationConfig: {
              responseModalities: ['AUDIO', 'TEXT'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text:
                    hospitalInstructions +
                    "\n\nONE-TIME RULES: (1) Assume the caller is a human. (2) Detect language from the caller's FIRST message only (Hindi or Gujarati) and use that language for the entire call; do not switch.",
                },
              ],
            },
            tools: [{ functionDeclarations: tools }],
          },
        };
        client.send(JSON.stringify(setup));
      });

      client.on('message', (message) => {
        try {
          const raw = message.toString();
          const data = JSON.parse(raw);

          if (data.error) {
            console.error('[Gemini] Server error:', JSON.stringify(data.error));
          }
          if (!data.setupComplete && !data.serverContent && !data.toolCall) {
            console.log('[Gemini] Server message keys:', Object.keys(data).join(', '));
            if (Object.keys(data).length <= 3)
              console.log('[Gemini] Server message:', raw.slice(0, 500));
          }

          if (data.setupComplete) {
            geminiReady = true;
            console.log('[Gemini] Session ready');
          }

          if (data.serverContent) {
            const turn = data.serverContent.modelTurn;
            if (turn && turn.parts) {
              for (const part of turn.parts) {
                if (part.inlineData && part.inlineData.mimeType === 'audio/pcm') {
                  const pcm24k = Buffer.from(part.inlineData.data, 'base64');
                  const pcm8k = resample24kTo8k(pcm24k);
                  const sid = streamSid || 'default';
                  for (let i = 0; i < pcm8k.length; i += EXOTEL_CHUNK_BYTES) {
                    const chunk = pcm8k.subarray(i, Math.min(i + EXOTEL_CHUNK_BYTES, pcm8k.length));
                    outboundBotBuffer.push({ sid, payload: chunk.toString('base64') });
                  }
                }
                if (part.functionCall) {
                  const { name, args } = part.functionCall;
                  let parsed = {};
                  try {
                    parsed = typeof args === 'string' ? JSON.parse(args) : args || {};
                  } catch (_) {}
                  runTool(name, parsed, (outputObj) => {
                    try {
                      client.send(
                        JSON.stringify({
                          toolResponse: {
                            functionResponses: [{ name, response: outputObj ?? {} }],
                          },
                        }),
                      );
                    } catch (e) {
                      console.error('[Gemini] Send toolResponse error:', e);
                    }
                  });
                }
              }
            }
          }

          if (data.toolCall) {
            const call = data.toolCall;
            const name = call.name || call.functionCall?.name;
            const args = call.args || call.functionCall?.args;
            let parsed = {};
            try {
              parsed = typeof args === 'string' ? JSON.parse(args) : args || {};
            } catch (_) {}
            if (name)
              runTool(name, parsed, (outputObj) => {
                try {
                  client.send(
                    JSON.stringify({
                      toolResponse: {
                        functionResponses: [{ name, response: outputObj ?? {} }],
                      },
                    }),
                  );
                } catch (e) {
                  console.error('[Gemini] Send toolResponse error:', e);
                }
              });
          }
        } catch (e) {
          console.error('[Gemini] Message parse error:', e);
        }
      });

      client.on('error', (err) => {
        console.error('[Gemini] WebSocket error:', err.message || err);
        cleanupGemini();
      });
      client.on('close', (code, reason) => {
        console.log('[Gemini] Live closed code=', code, 'reason=', reason?.toString() || reason);
        geminiWs = null;
      });

      return client;
    };

    const flushOutboundBotBuffer = (sendToExotel = true) => {
      if (!sendToExotel || userIsSpeaking) {
        outboundBotBuffer.length = 0;
        return;
      }
      while (outboundBotBuffer.length > 0) {
        const { sid, payload } = outboundBotBuffer.shift();
        try {
          ws.send(JSON.stringify({ event: 'media', streamSid: sid, media: { payload } }));
        } catch (e) {
          console.error('[Gemini/Exotel] Send media error:', e);
        }
      }
    };

    ws.on('message', (message) => {
      try {
        if (!message) return;
        const data = JSON.parse(message.toString());
        if (data.event === 'start') {
          streamSid = data.start?.streamSid ?? data.streamSid ?? null;
          callerPhone =
            data.start?.customParameters?.From ??
            data.start?.callerId ??
            data.start?.from ??
            'unknown';
          console.log(`[Gemini/Exotel] Call start streamSid=${streamSid} caller=${callerPhone}`);
          geminiWs = connectGeminiLive();
        } else if (data.event === 'media') {
          const payload = data.media?.payload;
          if (!payload || !geminiWs || geminiWs.readyState !== WebSocket.OPEN) return;
          if (!streamSid) streamSid = data.streamSid ?? data.media?.streamSid ?? streamSid;
          const pcm8k = Buffer.from(payload, 'base64');
          const pcm24k = resample8kTo24k(pcm8k);
          const rms = computeRms(pcm24k);
          const now = Date.now();
          const isSpeech = rms > TRANSCRIPT_ONLY_SPEECH_THRESHOLD;

          if (transcriptOnlyState.processing) {
            // skip
          } else if (isSpeech) {
            transcriptOnlyState.hadSpeechInTurn = true;
            transcriptOnlyState.lastSpeechAt = now;
            transcriptOnlyState.silenceStartedAt = null;
            transcriptOnlyState.userChunks.push(Buffer.from(pcm24k));
          } else {
            transcriptOnlyState.userChunks.push(Buffer.from(pcm24k));
            if (transcriptOnlyState.silenceStartedAt === null)
              transcriptOnlyState.silenceStartedAt = now;
            const totalBytes = transcriptOnlyState.userChunks.reduce((s, c) => s + c.length, 0);
            const silenceDuration = now - transcriptOnlyState.silenceStartedAt;
            if (
              transcriptOnlyState.hadSpeechInTurn &&
              totalBytes >= MIN_SPEECH_BYTES_24K &&
              silenceDuration >= TRANSCRIPT_ONLY_SILENCE_MS
            ) {
              const wavBuffer = pcm24kToWavBuffer(Buffer.concat(transcriptOnlyState.userChunks));
              transcriptOnlyState.userChunks = [];
              transcriptOnlyState.silenceStartedAt = null;
              transcriptOnlyState.lastSpeechAt = 0;
              transcriptOnlyState.hadSpeechInTurn = false;
              transcriptOnlyState.processing = true;

              transcribeWithWhisper(wavBuffer)
                .then((transcript) => {
                  if (!transcript || !geminiWs || geminiWs.readyState !== WebSocket.OPEN) return;
                  console.log('[Gemini] Input transcription (Whisper):', transcript);
                  callTranscript.push({ role: 'user', text: transcript });

                  if (!firstUserMessageReceived) {
                    firstUserMessageReceived = true;
                    humanDetected = true;
                    callerLanguage = detectCallerLanguage(transcript);
                    console.log(
                      '[Gemini] One-time detection: human=true, callerLanguage=',
                      callerLanguage,
                    );
                  }

                  geminiWs.send(
                    JSON.stringify({
                      clientContent: {
                        turns: [
                          {
                            role: 'user',
                            parts: [{ text: transcript }],
                          },
                        ],
                        turnComplete: true,
                      },
                    }),
                  );
                })
                .catch((err) => console.error('[Gemini] Whisper error:', err.message))
                .finally(() => {
                  transcriptOnlyState.processing = false;
                });
            }
          }
        } else if (data.event === 'stop') {
          console.log(`[Gemini/Exotel] Call stop for hospital: ${hospital.name}`);
          cleanupGemini();
          ws.close();
        }
      } catch (e) {
        console.error('[Gemini/Exotel] Message error:', e);
      }
    });

    ws.on('close', () => {
      console.log('[Gemini/Exotel] WebSocket disconnected');
      cleanupGemini();
    });
    ws.on('error', (err) => {
      console.error('[Gemini/Exotel] WebSocket error:', err);
      cleanupGemini();
    });
  });

  console.log('[Gemini] Route /media-gemini/:hospitalId attached');
}

module.exports = { attachGeminiRoutes };
