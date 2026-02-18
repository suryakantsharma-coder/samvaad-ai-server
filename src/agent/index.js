/**
 * Chat-bot Voice Agent
 * Integrates OpenAI ChatGPT Realtime API (audio in/out) with Exotel.
 * - Receives audio from Exotel (8kHz PCM, base64), resamples to 24kHz and streams to Realtime API.
 * - Receives audio from Realtime API (24kHz PCM), resamples to 8kHz and sends to Exotel in desired format.
 *
 * Exotel WebSocket protocol (same as voice-chat-bot): event "start" | "media" | "stop".
 * Outbound to Exotel: { event: "media", streamSid, media: { payload: "<base64>" } }.
 */

const express = require("express");
const expressWs = require("express-ws");
const WebSocket = require("ws");
const chatgpt = require("openai");
const mongoose = require("mongoose");
require("dotenv").config();
const env = require("../config/env");
const AppointmentModel = require("../models/appointment.model");
const HospitalModel = require("../models/hospital.model");
const DoctorModel = require("../models/doctor.model");
const PatientModel = require("../models/patient.model");
const { extractAppointmentFromTranscript } = require("./chatgpt");

// import express from "express";
// import expressWs from "express-ws";
// import WebSocket from "ws";
// import dotenv from "dotenv";
// import AppointmentModel from "../models/appointment.model";
// dotenv.config();

// =========================
// App setup
// =========================
const app = express();
expressWs(app);

// NOTE:
// Appointment creation is handled live via Realtime tool-calling (create_patient / create_appointment).
// We do NOT auto-create appointments on call end to avoid duplicates.

// =========================
// Configuration (use .env; never commit secrets)
// =========================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

// Exotel/Twilio media: 8kHz, 16-bit PCM, 20ms chunks = 320 bytes
const EXOTEL_SAMPLE_RATE = 8000;
const EXOTEL_SAMPLE_WIDTH = 2;
const EXOTEL_CHUNK_MS = 20;
const EXOTEL_CHUNK_BYTES =
  ((EXOTEL_SAMPLE_RATE * EXOTEL_CHUNK_MS) / 1000) * EXOTEL_SAMPLE_WIDTH; // 320

// OpenAI Realtime API: 24kHz PCM 16-bit
const OPENAI_SAMPLE_RATE = 24000;
const OPENAI_SAMPLE_WIDTH = 2;

// Resample ratio
const RESAMPLE_UP = OPENAI_SAMPLE_RATE / EXOTEL_SAMPLE_RATE; // 3
const RESAMPLE_DOWN = EXOTEL_SAMPLE_RATE / OPENAI_SAMPLE_RATE; // 1/3

// =========================
// Resampling: 8kHz <-> 24kHz (16-bit PCM)
// =========================
/**
 * Resample PCM 8kHz -> 24kHz (linear interpolation).
 * @param {Buffer} pcm8k - 16-bit LE PCM at 8kHz
 * @returns {Buffer} 16-bit LE PCM at 24kHz
 */
function resample8kTo24k(pcm8k) {
  const numSamples8k = pcm8k.length / 2;
  const numSamples24k = Math.floor(numSamples8k * RESAMPLE_UP);
  const out = Buffer.alloc(numSamples24k * 2);
  for (let i = 0; i < numSamples24k; i++) {
    const srcIdx = i / RESAMPLE_UP;
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

/**
 * Resample PCM 24kHz -> 8kHz (decimate: take every 3rd sample).
 * @param {Buffer} pcm24k - 16-bit LE PCM at 24kHz
 * @returns {Buffer} 16-bit LE PCM at 8kHz
 */
function resample24kTo8k(pcm24k) {
  const numSamples24k = pcm24k.length / 2;
  const numSamples8k = Math.floor(numSamples24k * RESAMPLE_DOWN);
  const out = Buffer.alloc(numSamples8k * 2);
  for (let i = 0; i < numSamples8k; i++) {
    const srcIdx = i * RESAMPLE_UP;
    const idx = Math.min(Math.floor(srcIdx), numSamples24k - 1);
    const sample = pcm24k.readInt16LE(idx * 2);
    out.writeInt16LE(sample, i * 2);
  }
  return out;
}

// =========================
// Parse appointment details from call transcript (for JSON log)
// =========================
function parseAppointmentFromTranscript(callTranscript, callerPhone) {
  const fullText = callTranscript.map((t) => t.text).join(" ");
  if (!fullText) return null;

  // Prefer last mention of Hospital A/B (usually in confirmation)
  const hospitalMatches = [...fullText.matchAll(/\bHospital\s+([AB])\b/gi)];
  const hospital = hospitalMatches.length
    ? `Hospital ${hospitalMatches[hospitalMatches.length - 1][1].toUpperCase()}`
    : null;

  const drMatch = fullText.match(/\bDr\.\s+([A-Za-z\s]+?)(?:\s+\(|,|\.|$)/);
  const doctorName = drMatch ? drMatch[1].trim() : null;

  // Patient name: "patient Sureshkant, age", "Patient: X", "मरीज का नाम X", etc.
  let patientName =
    fullText.match(/\bpatient\s+([A-Za-z]+)\s*(?:,|\.|\s+age)/i)?.[1] ||
    fullText
      .match(
        /(?:patient|मरीज|રોગી)[\s:]+([A-Za-z\u0900-\u0DFF\s]+?)(?:\s*[,.]|\s+age|\s+उम्र|$)/i,
      )?.[1]
      ?.trim() ||
    fullText
      .match(/(?:patient|Patient):\s*([A-Za-z\s]+?)(?:\s*[,.]|\s+age|$)/i)?.[1]
      ?.trim() ||
    fullText.match(
      /(?:confirmed for|with)\s+([A-Za-z]+)\s*(?:,|\.|age)/i,
    )?.[1] ||
    null;
  if (patientName) patientName = patientName.replace(/\s+/g, " ").trim();

  // Age: "age 55", "age: 55", "Age: 55", "उम्र 25", "55 years"
  const ageMatch =
    fullText.match(/(?:age|उम्र|ઉંમર)[\s:]*(\d{1,3})/i) ||
    fullText.match(/(\d{1,3})\s*(?:years?\s+old|साल|વર્ષ)/i) ||
    fullText.match(/\bage[:\s]+(\d{1,3})\b/i);
  const patientAge = ageMatch ? parseInt(ageMatch[1], 10) : null;

  // Date: "February 10th", "10th February", "10 February", "Feb 10"
  const dateMatch =
    fullText.match(
      /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?/i,
    ) ||
    fullText.match(
      /\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)/i,
    ) ||
    fullText.match(
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}/i,
    );
  const preferredDate = dateMatch ? dateMatch[0].trim() : null;

  // Time: "12 PM", "12:00 PM", "at 12 PM", "10 AM"
  const timeMatch =
    fullText.match(/\b(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\b/i) ||
    fullText.match(/(?:at|time)\s+(\d{1,2})\s*(?:AM|PM)/i);
  const preferredTime = timeMatch ? timeMatch[1].trim() : null;

  if (
    !hospital &&
    !doctorName &&
    !patientName &&
    !patientAge &&
    !preferredDate &&
    !preferredTime
  )
    return null;

  return {
    hospital,
    doctorName,
    patientName: patientName || null,
    patientAge,
    phone: callerPhone !== "unknown" ? callerPhone : null,
    preferredDate,
    preferredTime,
    callEndedAt: new Date().toISOString(),
  };
}

// =========================
// System instructions (voice agent) - set VOICE_AGENT_INSTRUCTIONS in .env to override
// Language: greeting only Hindi; rest Hindi or Gujarati.
// =========================

// const HOSPITAL_PROMPT = `
// You are ABC Hospital’s Calling Assistant. Speak warm, natural, and human-like (no robotic tone). Your job is to understand the caller’s symptoms, suggest the correct department/doctor from the provided list, and help book appointments. Detect language ONLY from the first caller message (English/Hindi/Gujarati) and LOCK it for the entire call (never switch). Respond immediately after the caller finishes speaking: start with a quick acknowledgment in the same language, then continue normally. Do NOT diagnose diseases and do NOT prescribe medicines. If symptoms sound life-threatening (severe chest pain, unconsciousness, heavy bleeding), redirect to the nearest emergency immediately. When booking, ask ONE question at a time in this order: patient name, patient age, phone number, preferred date, preferred time. Use these doctors only: General Medicine: Dr. Amit Sharma (Mon–Sat 10:00AM–2:00PM), Dr. Neha Verma (Mon–Fri 4:00PM–8:00PM). Cardiology: Dr. Rajesh Mehta (Mon–Sat 11:00AM–3:00PM). Orthopedics: Dr. Suresh Iyer (Mon–Fri 10:00AM–1:00PM). Dermatology: Dr. Pooja Malhotra (Tue–Sun 12:00PM–5:00PM). ENT: Dr. Vikram Singh (Mon–Sat 9:00AM–12:00PM). Pediatrics: Dr. Anjali Rao (Mon–Sat 10:00AM–4:00PM). Symptom mapping: Fever/cold/headache/weakness→General Medicine; Chest pain/BP/heart issues→Cardiology; Joint/back pain/fracture→Orthopedics; Skin allergy/rashes/acne→Dermatology; Ear/throat/sinus→ENT; Child-related issues→Pediatrics. IMPORTANT: Always output ONLY valid JSON with exactly 3 keys: intent, action, response. No extra text.
// `;

const HOSPITAL_PROMPT = `
You are a Hospital Calling Assistant. Follow this flow strictly.

LANGUAGE:
- GREETING: Always and ONLY in Hindi. Start every call with a warm Hindi greeting only, e.g. "नमस्ते, अस्पताल की तरफ से आपका स्वागत है।"
- After greeting, detect the caller's language from their FIRST reply (only Hindi or Gujarati). Use that same language for the REST of the call. Do not use English after the greeting; speak only in Hindi or Gujarati based on what the caller uses.

CALL FLOW:
1) GREETING (first thing): Say a warm greeting ONLY in Hindi. Then ask in Hindi: "क्या आप Hospital A जाना चाहेंगे या Hospital B?" Do not suggest doctors until they choose.
2) HOSPITAL CHOICE: Wait for their answer (Hospital A or B). Then continue in their language (Hindi or Gujarati).
3) DOCTORS: Based on their choice, use ONLY that hospital's list. HOSPITAL A: General Medicine: Dr. Amit Sharma (Mon–Sat 10:00AM–2:00PM), Dr. Neha Verma (Mon–Fri 4:00PM–8:00PM); Cardiology: Dr. Rajesh Mehta (Mon–Sat 11:00AM–3:00PM); Orthopedics: Dr. Suresh Iyer (Mon–Fri 10:00AM–1:00PM); Dermatology: Dr. Pooja Malhotra (Tue–Sun 12:00PM–5:00PM); ENT: Dr. Vikram Singh (Mon–Sat 9:00AM–12:00PM); Pediatrics: Dr. Anjali Rao (Mon–Sat 10:00AM–4:00PM). HOSPITAL B: General Medicine: Dr. Karan Patel (Mon–Fri 9:00AM–1:00PM), Dr. Priya Desai (Tue–Sat 2:00PM–6:00PM); Cardiology: Dr. Sunil Nair (Mon–Sat 10:00AM–2:00PM); Orthopedics: Dr. Meera Krishnan (Mon–Fri 11:00AM–3:00PM); Dermatology: Dr. Ravi Joshi (Mon–Sat 12:00PM–4:00PM); ENT: Dr. Deepa Reddy (Mon–Fri 9:00AM–12:00PM); Pediatrics: Dr. Arun Menon (Mon–Sat 10:00AM–5:00PM). Symptom mapping: Fever/cold/headache/weakness→General Medicine; Chest pain/BP/heart→Cardiology; Joint/back pain/fracture→Orthopedics; Skin allergy/rashes/acne→Dermatology; Ear/throat/sinus→ENT; Child-related→Pediatrics.
4) BOOKING: Ask ONE question at a time in this exact order: patient name (मरीज का नाम / રોગીનું નામ), patient age (उम्र / ઉંમર), phone number, preferred date (तारीख / તારીખ), preferred time (समय / સમય).
5) RULES: Do NOT diagnose or prescribe. If life-threatening, tell them to go to nearest emergency.
6) When confirming the appointment, say clearly in one sentence: "Hospital A/B, Dr. [Name], patient [name], age [number], phone [number], date [date], time [time]." This helps us log the appointment.
`;

// const HOSPITAL_PROMPT = `
// તમે ABC Hospital ના Calling Assistant છો. શરૂઆત હંમેશા ABC Hospital તરફથી warm greeting થી કરો. તમારી ભાષા ગરમજોશીભરી, નેચરલ અને માણસ જેવી હોવી જોઈએ (robotic નહીં). તમારું કામ કોલર ના symptoms સમજવું, આપેલી doctor list માંથી યોગ્ય department/doctor suggest કરવું, અને appointment book કરવામાં મદદ કરવી છે. ભાષા ONLY પહેલી caller message પરથી detect કરો (English/Hindi/Gujarati) અને આખા call દરમિયાન એ જ ભાષા LOCK રાખો (વચ્ચે language switch નહીં કરવું). Caller બોલીને પૂરો કરે એટલે તરત જવાબ આપો: પહેલા એ જ ભાષામાં નાનું acknowledgment આપો, પછી naturally આખો જવાબ આપો. કોઈપણ બીમારીનું diagnosis ન કરો અને કોઈ medicine prescribe ન કરો. જો symptoms life-threatening લાગે (severe chest pain, unconsciousness, heavy bleeding), તો તરત nearest emergency માં જવા માટે redirect કરો. Booking વખતે માત્ર ONE question at a time પૂછો, આ જ order માં: patient name, patient age, phone number, preferred date, preferred time. માત્ર આ doctors જ use કરો: General Medicine: Dr. Amit Sharma (Mon–Sat 10:00AM–2:00PM), Dr. Neha Verma (Mon–Fri 4:00PM–8:00PM). Cardiology: Dr. Rajesh Mehta (Mon–Sat 11:00AM–3:00PM). Orthopedics: Dr. Suresh Iyer (Mon–Fri 10:00AM–1:00PM). Dermatology: Dr. Pooja Malhotra (Tue–Sun 12:00PM–5:00PM). ENT: Dr. Vikram Singh (Mon–Sat 9:00AM–12:00PM). Pediatrics: Dr. Anjali Rao (Mon–Sat 10:00AM–4:00PM). Symptom mapping: Fever/cold/headache/weakness→General Medicine; Chest pain/BP/heart issues→Cardiology; Joint/back pain/fracture→Orthopedics; Skin allergy/rashes/acne→Dermatology; Ear/throat/sinus→ENT; Child-related issues→Pediatrics. IMPORTANT: હંમેશા ONLY valid JSON output કરો જેમાં exactly 3 keys હોવી જોઈએ: intent, action, response। કોઈ extra text નહીં.
// `;
const DEFAULT_INSTRUCTIONS =
  process.env.VOICE_AGENT_INSTRUCTIONS || HOSPITAL_PROMPT;
// `You are a friendly and helpful voice assistant. Speak clearly and concisely. Keep responses brief and natural for a phone call.`;

// =========================
// Helper: Get hospital-specific instructions with doctors from database
// =========================
const getHospitalInstructions = async (hospital) => {
  if (!hospital) return DEFAULT_INSTRUCTIONS;

  try {
    // Fetch all doctors for this hospital
    const doctors = await DoctorModel.find({ hospital: hospital._id })
      .select("fullName designation availability status")
      .lean();

    // Group doctors by designation/department
    const doctorsByDept = {};
    doctors.forEach((doctor) => {
      const dept = doctor.designation || "General";
      if (!doctorsByDept[dept]) {
        doctorsByDept[dept] = [];
      }
      doctorsByDept[dept].push({
        name: doctor.fullName,
        designation: doctor.designation,
        availability: doctor.availability || "9 AM - 5 PM",
        status: doctor.status || "On Duty",
      });
    });

    // Build doctor list string for prompt
    let doctorListText = "";
    Object.keys(doctorsByDept).forEach((dept) => {
      doctorListText += `\n${dept}: `;
      const deptDoctors = doctorsByDept[dept];
      doctorListText += deptDoctors
        .map(
          (doc) =>
            `Dr. ${doc.name} (${doc.availability})${doc.status !== "On Duty" ? ` - Status: ${doc.status}` : ""}`,
        )
        .join(", ");
    });

    // Build dynamic prompt with hospital name and doctors
    const dynamicPrompt = `
You are ${hospital.name}'s Calling Assistant. Follow this flow strictly.

HOSPITAL INFORMATION:
- Hospital Name: ${hospital.name}
- Hospital Address: ${hospital.address}, ${hospital.city} - ${hospital.pincode}
- Hospital Phone: ${hospital.phoneCountryCode || "+91"} ${hospital.phoneNumber}

AVAILABLE DOCTORS AT ${hospital.name.toUpperCase()}:${doctorListText || "\nNo doctors currently available. Please contact the hospital directly."}

LANGUAGE:
- GREETING: Always and ONLY in Hindi. Start every call with a warm Hindi greeting mentioning the hospital name, e.g. "नमस्ते, ${hospital.name} की तरफ से आपका स्वागत है।"
- After greeting, detect the caller's language from their FIRST reply (only Hindi or Gujarati). Use that same language for the REST of the call. Do not use English after the greeting; speak only in Hindi or Gujarati based on what the caller uses.

CALL FLOW:
0) CONTEXT: The hospital is already selected (this call is for ${hospital.name}). Do NOT ask the caller to choose Hospital A/B.
1) GREETING (first thing): Say a warm greeting ONLY in Hindi mentioning ${hospital.name}. Then ask: "कृपया अपनी समस्या / बीमारी बताएं।"
2) ILLNESS/REASON: Listen and capture the illness/reason the caller states (e.g. "chest pain", "skin rash"). This is the reason for the visit—you must use this exact reason from the call when creating the appointment later; do not use any pre-set or stored value.
3) PATIENT TYPE: Ask: "क्या यह नया मरीज है या पहले से रजिस्टर मरीज?"
4) EXISTING PATIENT:
   - If existing: Ask for the Patient ID (format like P-YYYY-000001).
   - Find the patient with that patientId by calling fetch_patient_by_patientId (lookup is by patientId). You get back the patient record including _id.
   - After result: Confirm patient details (name/age/gender/phone). For creating the appointment later, use this patient's _id (not the patientId).
5) NEW PATIENT:
   - If new: Ask ONE question at a time: full name, age, gender (Male/Female/Other). You may ask for phone number but it is optional—the system automatically uses the caller's phone number (the number Exotel received the call from) when creating the patient.
   - Call the internal tool create_patient to create the patient. You get back patientId and the patient record including _id.
   - Confirm the new patientId to the caller. For creating the appointment later, use this patient's _id (the primary key), not the patientId.
6) DOCTOR: First call the internal tool list_doctors to get the FULL list of all doctors for this hospital (each has _id, fullName, designation). Pick the doctor whose designation matches the patient's illness/reason (e.g. Cardiologist for heart, Dermatologist for skin). Use ONLY that doctor's _id (the primary key) when creating the appointment—never use name or doctorId.
7) APPOINTMENT TIME: Ask preferred date and preferred time (one at a time). Confirm back the date/time.
8) CONFIRMATION: Confirm in one sentence: "${hospital.name}, Dr. [Name], patient [name], patientId [P-...], phone [number], reason [reason], date [date], time [time]."
9) CREATE APPOINTMENT: Call create_appointment with: patientObjectId = the patient's _id, doctorObjectId = the doctor's _id from list_doctors, reason = the illness/reason the caller stated in step 2 (from the call, not from patient record), and appointmentDateTimeISO. The reason must be what the caller said during this call.
10) FINAL: If appointment is created successfully, tell the caller the appointmentId (A-YYYY-000001).

RULES:
- Do NOT diagnose or prescribe medicines.
- If life-threatening symptoms, advise emergency immediately.
- Never mention tool names or JSON. Tools are internal.

IMPORTANT: Always call list_doctors to get the current list of doctors; pick from that list by matching designation to the patient's illness. Use only the doctor's _id from that list when booking. Do not invent doctor names or ids.
`;

    return dynamicPrompt;
  } catch (err) {
    console.error(
      `[Agent] Error fetching doctors for hospital ${hospital.name}:`,
      err.message,
    );
    // Fallback to default instructions if doctor fetch fails
    return `You are ${hospital.name}'s Calling Assistant. ${DEFAULT_INSTRUCTIONS}`;
  }
};

// =========================
// WebSocket: Exotel <-> OpenAI Realtime bridge (hospital-specific)
// Route: /media/:hospitalId
// =========================
app.ws("/media/:hospitalId", async (ws, req) => {
  const { hospitalId } = req.params;

  // Validate hospitalId format
  if (!mongoose.isValidObjectId(hospitalId)) {
    console.error(`[Exotel] Invalid hospitalId format: ${hospitalId}`);
    ws.close(1008, "Invalid hospital ID");
    return;
  }

  // Look up hospital from database
  let hospital;
  try {
    hospital = await HospitalModel.findById(hospitalId).lean();
    if (!hospital) {
      console.error(`[Exotel] Hospital not found: ${hospitalId}`);
      ws.close(1008, "Hospital not found");
      return;
    }
    console.log(
      `[Exotel] WebSocket connected for hospital: ${hospital.name} (${hospitalId})`,
    );
  } catch (err) {
    console.error(`[Exotel] Error fetching hospital: ${err.message}`);
    ws.close(1011, "Server error");
    return;
  }

  // Fetch hospital-specific instructions with doctors from database
  let hospitalInstructions;
  try {
    hospitalInstructions = await getHospitalInstructions(hospital);
    console.log(
      `[Agent] Loaded instructions for ${hospital.name} with doctors from database`,
    );
  } catch (err) {
    console.error(
      `[Agent] Error generating hospital instructions: ${err.message}`,
    );
    hospitalInstructions = DEFAULT_INSTRUCTIONS;
  }

  // =========================
  // Realtime tools (function calling) to integrate DB actions
  // =========================
  const tools = [
    {
      type: "function",
      name: "fetch_patient_by_patientId",
      description:
        "Find the patient using patientId (e.g. P-2026-000001) for the current hospital. Lookup is by patientId only. Returns the patient record including _id; use that _id as patientObjectId when calling create_appointment.",
      parameters: {
        type: "object",
        properties: {
          patientId: {
            type: "string",
            description: "Patient ID like P-2026-000001",
          },
        },
        required: ["patientId"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "create_patient",
      description:
        "Create a new patient for the current hospital and return patientId + details including _id. The caller's phone number from the call is automatically used for phoneNumber when not provided. Use the returned _id when linking to an appointment via create_appointment.",
      parameters: {
        type: "object",
        properties: {
          fullName: { type: "string" },
          age: { type: "number" },
          gender: { type: "string", enum: ["Male", "Female", "Other"] },
          phoneNumber: {
            type: "string",
            description:
              "Optional. If omitted or 'not provided', the system uses the phone number Exotel received the call from.",
          },
          reason: { type: "string" },
        },
        required: ["fullName", "age", "gender", "reason"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "list_doctors",
      description:
        "List ALL doctors for the current hospital. Returns every doctor with _id, fullName, designation (e.g. Cardiologist, Dermatologist), availability, status. Use this list to pick the doctor whose designation matches the patient's illness, then use that doctor's _id as doctorObjectId when calling create_appointment.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "search_doctors",
      description:
        "Search doctors by name or designation within the current hospital (optional filter). Returns matching doctors with _id. To get the full list first, use list_doctors instead. Use the selected doctor's _id as doctorObjectId when calling create_appointment.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number", default: 10 },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "create_appointment",
      description:
        "Create an appointment linking patient and doctor by their database _id. reason must be the illness/reason the caller stated during this call (step 2)—do not use a pre-set or stored value; take it from what the caller said.",
      parameters: {
        type: "object",
        properties: {
          doctorObjectId: {
            type: "string",
            description:
              "The doctor's _id from list_doctors result (MongoDB ObjectId)",
          },
          patientObjectId: {
            type: "string",
            description:
              "The patient's _id from fetch_patient_by_patientId or create_patient result (MongoDB ObjectId)",
          },
          reason: {
            type: "string",
            description:
              "The illness/reason the caller stated during the call (what they said when asked about their problem). Do not use patient record reason—use only what was said in this call.",
          },
          appointmentDateTimeISO: {
            type: "string",
            description: "UTC ISO string, e.g. 2026-02-12T12:00:00.000Z",
          },
          type: { type: "string", default: "call" },
        },
        required: [
          "doctorObjectId",
          "patientObjectId",
          "reason",
          "appointmentDateTimeISO",
        ],
        additionalProperties: false,
      },
    },
  ];

  let streamSid = null;
  let callerPhone = null;
  let openaiWs = null;
  let isBotSpeaking = false;
  let openaiReady = false;
  let warnedNoStreamSid = false;
  const audioQueue = []; // Queue Exotel audio until session.updated
  const callTranscript = []; // { role: "user"|"assistant", text: string }
  let appointmentDetails = null;
  let callSummaryWritten = false;

  const cleanupOpenAI = () => {
    if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
      try {
        openaiWs.close();
      } catch (e) {
        console.error("[OpenAI] Error closing:", e);
      }
      openaiWs = null;
    }
  };

  const connectOpenAIRealtime = () => {
    if (!OPENAI_API_KEY) {
      console.error("[OpenAI] OPENAI_API_KEY not set");
      return null;
    }
    const model = "gpt-realtime-mini-2025-12-15";
    const url = `wss://api.openai.com/v1/realtime?model=${model}`;
    const client = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    // Realtime API may send function_call via response.output_item.added + response.function_call_arguments.done
    const pendingFunctionCalls = {};

    client.on("open", () => {
      console.log(`[OpenAI] Realtime connected for hospital: ${hospital.name}`);
      // Beta Realtime API format: no session.type, use modalities + input_audio_format etc.
      const sessionUpdate = {
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: hospitalInstructions, // Use hospital-specific instructions
          voice: "alloy",
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: { model: "whisper-1" },
          tools,
          tool_choice: "auto",
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 200,
          },
        },
      };
      client.send(JSON.stringify(sessionUpdate));
    });

    client.on("message", (message) => {
      try {
        const event = JSON.parse(message.toString());

        // Log Realtime events that are relevant to tools (optional: set to true to see all event types)
        const logEventTypes = [
          "response.output_item.added",
          "response.function_call_arguments.done",
          "conversation.item.created",
        ];
        if (logEventTypes.includes(event.type)) {
          console.log(
            "[Agent] Realtime event:",
            event.type,
            event.item?.type || "",
            event.item?.name || event.call_id || "",
          );
        }

        const hospitalObjectId = hospital?._id;

        const sendToolOutput = async (callId, outputObj) => {
          console.log(
            "[Agent] Tool response (data sent to ChatGPT):",
            JSON.stringify(outputObj, null, 2),
          );
          client.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: callId,
                output: JSON.stringify(outputObj ?? {}),
              },
            }),
          );
          client.send(JSON.stringify({ type: "response.create" }));
        };

        const runTool = async (callId, name, args) => {
          console.log(
            "[Agent] ChatGPT requested tool:",
            name,
            "| call_id:",
            callId,
            "| hospitalId:",
            String(hospitalObjectId || ""),
          );
          console.log(
            "[Agent] ChatGPT tool args (full):",
            JSON.stringify(args, null, 2),
          );
          try {
            if (name === "fetch_patient_by_patientId") {
              const patientId = String(args.patientId || "").trim();
              console.log(
                "[Agent] fetch_patient_by_patientId: looking up patientId:",
                patientId,
              );
              const patient = await PatientModel.findOne({
                patientId,
                hospital: hospitalObjectId,
              }).lean();
              if (!patient) {
                console.log(
                  "[Agent] fetch_patient_by_patientId: NOT FOUND for patientId:",
                  patientId,
                );
                return await sendToolOutput(callId, {
                  ok: false,
                  message: "Patient not found for this hospital.",
                });
              }
              const out = {
                ok: true,
                patient: {
                  _id: String(patient._id),
                  patientId: patient.patientId,
                  fullName: patient.fullName,
                  age: patient.age,
                  gender: patient.gender,
                  phoneNumber: patient.phoneNumber,
                  reason: patient.reason,
                  hospital: String(patient.hospital || ""),
                },
              };
              console.log(
                "[Agent] fetch_patient_by_patientId: FOUND | _id:",
                out.patient._id,
                "| patientId:",
                out.patient.patientId,
                "| fullName:",
                out.patient.fullName,
              );
              return await sendToolOutput(callId, out);
            }

            if (name === "create_patient") {
              const fullName = String(args.fullName || "").trim();
              const age = Number(args.age);
              const gender = String(args.gender || "").trim();
              const reason = String(args.reason || "").trim();
              // Use Exotel caller number (number that called in); fall back to what model collected
              const argsPhone = String(args.phoneNumber || "").trim();
              const fromCall =
                callerPhone && callerPhone !== "unknown" ? callerPhone : "";
              const phoneNumber =
                fromCall ||
                (argsPhone && argsPhone.toLowerCase() !== "not provided"
                  ? argsPhone
                  : "");
              console.log("[Agent] create_patient inputs:", {
                fullName,
                age,
                gender,
                phoneNumberFromArgs: argsPhone,
                callerPhoneFromExotel: callerPhone,
                phoneNumberUsed: phoneNumber,
                reason,
              });
              if (
                !fullName ||
                !Number.isFinite(age) ||
                age < 0 ||
                !phoneNumber ||
                !reason
              ) {
                console.log(
                  "[Agent] create_patient validation failed: missing/invalid fields",
                );
                return await sendToolOutput(callId, {
                  ok: false,
                  message: "Missing/invalid patient fields.",
                });
              }
              const year = new Date().getFullYear();
              const prefix = `P-${year}-`;
              const last = await PatientModel.findOne({
                patientId: new RegExp(`^${prefix}`),
              })
                .sort({ patientId: -1 })
                .select("patientId")
                .lean();
              const nextNum = last
                ? parseInt(String(last.patientId).slice(prefix.length), 10) + 1
                : 1;
              const patientId = `${prefix}${String(nextNum).padStart(6, "0")}`;
              console.log(
                "[Agent] Creating patient in DB with patientId:",
                patientId,
              );
              const patient = await PatientModel.create({
                hospital: hospitalObjectId,
                patientId,
                fullName,
                age,
                gender,
                phoneNumber,
                reason,
              });
              const out = {
                ok: true,
                patient: {
                  _id: String(patient._id),
                  patientId: patient.patientId,
                  fullName: patient.fullName,
                  age: patient.age,
                  gender: patient.gender,
                  phoneNumber: patient.phoneNumber,
                  reason: patient.reason,
                  hospital: String(patient.hospital || ""),
                },
              };
              console.log(
                "[Agent] create_patient: CREATED | _id:",
                out.patient._id,
                "| patientId:",
                out.patient.patientId,
              );
              return await sendToolOutput(callId, out);
            }

            if (name === "list_doctors") {
              console.log(
                "[Agent] list_doctors: fetching ALL doctors for hospital:",
                String(hospitalObjectId || ""),
              );
              const doctors = await DoctorModel.find({
                hospital: hospitalObjectId,
              })
                .select("_id fullName doctorId designation availability status")
                .lean();
              const doctorsPayload = doctors.map((d) => ({
                _id: String(d._id),
                doctorId: d.doctorId || "",
                fullName: d.fullName,
                designation: d.designation,
                availability: d.availability,
                status: d.status,
              }));
              console.log(
                "[Agent] list_doctors: DB returned",
                doctors.length,
                "doctors. Full list (use _id to book):",
                JSON.stringify(doctorsPayload, null, 2),
              );
              return await sendToolOutput(callId, {
                ok: true,
                doctors: doctorsPayload,
                message: `List of ${doctors.length} doctor(s). Pick the doctor whose designation matches the patient's illness, then use that doctor's _id as doctorObjectId in create_appointment.`,
              });
            }

            if (name === "search_doctors") {
              const query = String(args.query || "").trim();
              const limit = Math.max(1, Math.min(20, Number(args.limit || 10)));
              console.log(
                "[Agent] search_doctors: query:",
                query,
                "limit:",
                limit,
              );
              if (!query)
                return await sendToolOutput(callId, {
                  ok: false,
                  message:
                    "Query is required. To get all doctors use list_doctors.",
                });
              const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const regex = new RegExp(escaped, "i");
              const doctors = await DoctorModel.find({
                hospital: hospitalObjectId,
                $or: [{ fullName: regex }, { designation: regex }],
              })
                .select("_id fullName doctorId designation availability status")
                .limit(limit)
                .lean();
              console.log(
                "[Agent] search_doctors: DB returned",
                doctors.length,
                "doctors. Raw from DB:",
                JSON.stringify(
                  doctors.map((d) => ({
                    _id: String(d._id),
                    doctorId: d.doctorId,
                    fullName: d.fullName,
                    designation: d.designation,
                  })),
                  null,
                  2,
                ),
              );
              const doctorsPayload = doctors.map((d) => ({
                _id: String(d._id),
                doctorId: d.doctorId || "",
                fullName: d.fullName,
                designation: d.designation,
                availability: d.availability,
                status: d.status,
              }));
              console.log(
                "[Agent] search_doctors: sending to ChatGPT (each doctor has _id for create_appointment):",
                JSON.stringify(doctorsPayload, null, 2),
              );
              return await sendToolOutput(callId, {
                ok: true,
                doctors: doctorsPayload,
              });
            }

            if (name === "create_appointment") {
              const doctorObjectId = String(args.doctorObjectId || "").trim();
              const patientObjectId = String(args.patientObjectId || "").trim();
              const reason = String(args.reason || "").trim();
              const appointmentDateTimeISO = String(
                args.appointmentDateTimeISO || "",
              ).trim();
              const type = String(args.type || "call").trim() || "call";
              console.log(
                "[Agent] create_appointment: ChatGPT sent doctorObjectId:",
                doctorObjectId,
                "patientObjectId:",
                patientObjectId,
                "reason:",
                reason,
                "appointmentDateTimeISO:",
                appointmentDateTimeISO,
              );
              if (
                !mongoose.isValidObjectId(doctorObjectId) ||
                !mongoose.isValidObjectId(patientObjectId)
              ) {
                console.log(
                  "[Agent] create_appointment: REJECTED - invalid ObjectId (doctorObjectId valid:",
                  mongoose.isValidObjectId(doctorObjectId),
                  "patientObjectId valid:",
                  mongoose.isValidObjectId(patientObjectId),
                  ")",
                );
                return await sendToolOutput(callId, {
                  ok: false,
                  message: "Invalid doctor or patient id.",
                });
              }
              const dt = new Date(appointmentDateTimeISO);
              if (Number.isNaN(dt.getTime()))
                return await sendToolOutput(callId, {
                  ok: false,
                  message: "Invalid appointmentDateTimeISO.",
                });
              if (!reason)
                return await sendToolOutput(callId, {
                  ok: false,
                  message: "Reason is required.",
                });

              const [doctor, patient] = await Promise.all([
                DoctorModel.findOne({
                  _id: doctorObjectId,
                  hospital: hospitalObjectId,
                }).lean(),
                PatientModel.findOne({
                  _id: patientObjectId,
                  hospital: hospitalObjectId,
                }).lean(),
              ]);
              console.log(
                "[Agent] create_appointment: Doctor lookup by _id:",
                doctorObjectId,
                "->",
                doctor ? "FOUND" : "NOT FOUND",
                doctor
                  ? { _id: String(doctor._id), fullName: doctor.fullName }
                  : "",
              );
              console.log(
                "[Agent] create_appointment: Patient lookup by _id:",
                patientObjectId,
                "->",
                patient ? "FOUND" : "NOT FOUND",
                patient
                  ? { _id: String(patient._id), fullName: patient.fullName }
                  : "",
              );
              if (!doctor)
                return await sendToolOutput(callId, {
                  ok: false,
                  message: "Doctor not found for this hospital.",
                });
              if (!patient)
                return await sendToolOutput(callId, {
                  ok: false,
                  message: "Patient not found for this hospital.",
                });

              const year = new Date().getFullYear();
              const prefix = `A-${year}-`;
              const last = await AppointmentModel.findOne({
                appointmentId: new RegExp(`^${prefix}`),
              })
                .sort({ appointmentId: -1 })
                .select("appointmentId")
                .lean();
              const nextNum = last
                ? parseInt(
                    String(last.appointmentId).slice(prefix.length),
                    10,
                  ) + 1
                : 1;
              const appointmentId = `${prefix}${String(nextNum).padStart(6, "0")}`;
              const appointmentPayload = {
                hospital: hospitalObjectId,
                appointmentId,
                patient: patientObjectId,
                doctor: doctorObjectId,
                reason,
                status: "Upcoming",
                type,
                appointmentDateTime: dt,
              };
              console.log(
                "[Agent] create_appointment: exact payload before save to database:",
              );
              console.log(JSON.stringify(appointmentPayload, null, 2));
              const appointment =
                await AppointmentModel.create(appointmentPayload);
              return await sendToolOutput(callId, {
                ok: true,
                appointment: {
                  _id: String(appointment._id),
                  appointmentId: appointment.appointmentId,
                  hospital: String(appointment.hospital || ""),
                  patient: String(appointment.patient),
                  doctor: String(appointment.doctor),
                  reason: appointment.reason,
                  status: appointment.status,
                  type: appointment.type,
                  appointmentDateTime:
                    appointment.appointmentDateTime?.toISOString?.() || null,
                },
              });
            }

            console.log("[Agent] Unknown tool:", name);
            return await sendToolOutput(callId, {
              ok: false,
              message: `Unknown tool: ${name}`,
            });
          } catch (err) {
            console.error(
              "[Agent] Tool execution error:",
              err.message,
              err.stack,
            );
            return await sendToolOutput(callId, {
              ok: false,
              message: err.message || "Tool error",
            });
          }
        };

        // 1) Server sends conversation.item.created when an item (e.g. function_call) is added to the conversation
        if (
          event.type === "conversation.item.created" &&
          event.item?.type === "function_call"
        ) {
          const { name, arguments: argsJson, call_id } = event.item;
          let args = {};
          try {
            args = argsJson ? JSON.parse(argsJson) : {};
          } catch (e) {
            console.error(
              "[Agent] Failed to parse function args (conversation.item.created):",
              argsJson,
            );
          }
          if (Object.keys(args).length > 0) {
            runTool(call_id, name, args);
          } else {
            pendingFunctionCalls[call_id] = { name };
            console.log(
              "[Agent] Stored pending function call (no args yet):",
              name,
              call_id,
            );
          }
        }

        // 2) During response streaming, server sends response.output_item.added for each new item (e.g. function_call)
        if (
          event.type === "response.output_item.added" &&
          event.item?.type === "function_call"
        ) {
          const { name, call_id } = event.item;
          pendingFunctionCalls[call_id] = { name };
          console.log(
            "[Agent] Pending function call (response.output_item.added):",
            name,
            call_id,
          );
          const argsJson = event.item.arguments;
          if (argsJson) {
            try {
              const args = JSON.parse(argsJson);
              delete pendingFunctionCalls[call_id];
              runTool(call_id, name, args);
            } catch (e) {
              console.error(
                "[Agent] Failed to parse function args (output_item.added):",
                argsJson,
              );
            }
          }
        }

        // 3) When function call arguments finish streaming, we get the full arguments here
        if (event.type === "response.function_call_arguments.done") {
          const { call_id, arguments: argsJson } = event;
          const pending = pendingFunctionCalls[call_id];
          if (pending) {
            delete pendingFunctionCalls[call_id];
            let args = {};
            try {
              args = argsJson ? JSON.parse(argsJson) : {};
            } catch (e) {
              console.error(
                "[Agent] Failed to parse function args (arguments.done):",
                argsJson,
              );
            }
            console.log(
              "[Agent] Running tool from response.function_call_arguments.done:",
              pending.name,
              call_id,
            );
            runTool(call_id, pending.name, args);
          }
        }

        if (event.type === "session.updated") {
          openaiReady = true;
          console.log("[OpenAI] Session ready");
          while (audioQueue.length > 0) {
            const b64 = audioQueue.shift();
            client.send(
              JSON.stringify({ type: "input_audio_buffer.append", audio: b64 }),
            );
          }
          try {
            client.send(JSON.stringify({ type: "response.create" }));
          } catch (_) {}
        }

        // Stream output audio to Exotel: 8kHz 16-bit PCM in 20ms (320-byte) chunks
        if (
          event.type === "response.audio.delta" ||
          event.type === "response.output_audio.delta"
        ) {
          const b64 = event.delta || event.audio;
          if (b64) {
            const sid = streamSid || "default";
            if (!streamSid && !warnedNoStreamSid) {
              warnedNoStreamSid = true;
              console.warn(
                "[Exotel] streamSid was null; sending media with streamSid='default'. If no audio on call, check Exotel payload for stream ID.",
              );
            }
            const pcm24k = Buffer.from(b64, "base64");
            const pcm8k = resample24kTo8k(pcm24k);
            for (let i = 0; i < pcm8k.length; i += EXOTEL_CHUNK_BYTES) {
              const chunk = pcm8k.subarray(
                i,
                Math.min(i + EXOTEL_CHUNK_BYTES, pcm8k.length),
              );
              const payload = chunk.toString("base64");
              try {
                ws.send(
                  JSON.stringify({
                    event: "media",
                    streamSid: sid,
                    media: { payload },
                  }),
                );
              } catch (e) {
                console.error("[Exotel] Send media error:", e);
              }
            }
            if (!isBotSpeaking) {
              isBotSpeaking = true;
              console.log("[Exotel] Bot started speaking");
            }
          }
        }

        if (
          event.type === "response.done" ||
          event.type === "response.output_audio.done"
        ) {
          if (isBotSpeaking) {
            isBotSpeaking = false;
            console.log("[OpenAI] Bot finished speaking");
          }
        }

        if (event.type === "input_audio_buffer.speech_started") {
          console.log("[OpenAI] User speech started");
        }
        if (event.type === "input_audio_buffer.speech_stopped") {
          console.log("[OpenAI] User speech stopped");
        }
        // Collect user transcript
        if (
          event.type ===
            "conversation.item.input_audio_transcription.completed" &&
          event.transcript
        ) {
          callTranscript.push({ role: "user", text: event.transcript });
        }
        // Collect assistant transcript (Realtime API may send response.output_audio_transcript.done)
        if (
          event.type === "response.output_audio_transcript.done" &&
          event.transcript
        ) {
          callTranscript.push({ role: "assistant", text: event.transcript });
        }
        if (
          event.type === "response.audio_transcript.done" &&
          event.transcript
        ) {
          callTranscript.push({ role: "assistant", text: event.transcript });
        }
        if (event.type === "error") {
          console.error("[OpenAI] Event error:", event.error || event);
        }
      } catch (e) {
        console.error("[OpenAI] Message parse error:", e);
      }
    });

    client.on("error", (err) => {
      console.error("[OpenAI] WebSocket error:", err);
      cleanupOpenAI();
    });

    client.on("close", () => {
      console.log("[OpenAI] Realtime closed");
      openaiWs = null;
    });

    return client;
  };

  // Extract stream ID from any of the keys Exotel/Twilio might use
  const extractStreamSid = (obj) => {
    if (typeof obj !== "object") return null;
    if (obj.streamSid) return obj.streamSid;
    if (obj.stream_id) return obj.stream_id;
    if (obj.CallSid) return obj.CallSid;
    if (obj.callSid) return obj.callSid;
    if (obj.start?.streamSid) return obj.start.streamSid;
    if (obj.start?.stream_id) return obj.start.stream_id;
    if (obj.Stream?.StreamSID) return obj.Stream.StreamSID;
    if (obj.media?.streamSid) return obj.media.streamSid;
    return null;
  };

  let firstMessageLogged = false;
  ws.on("message", (message) => {
    try {
      if (!message) return;
      const data = JSON.parse(message.toString());

      const extracted = extractStreamSid(data);
      if (extracted && extracted !== streamSid) {
        streamSid = extracted;
        console.log("[Exotel] streamSid:", streamSid);
      }

      if (!firstMessageLogged) {
        firstMessageLogged = true;
        console.log(
          "[Exotel] First message keys:",
          Object.keys(data).join(", "),
          data.start
            ? " start.keys: " + Object.keys(data.start).join(", ")
            : "",
        );
      }

      if (data.event === "start") {
        if (!streamSid)
          streamSid = data.start?.streamSid ?? data.streamSid ?? null;
        callerPhone =
          data.start?.customParameters?.From ??
          data.start?.callerId ??
          data.start?.from ??
          "unknown";
        console.log(
          `[Exotel] Call start streamSid=${streamSid} caller=${callerPhone}`,
        );
        openaiWs = connectOpenAIRealtime();
      } else if (data.event === "media") {
        const payload = data.media?.payload;
        if (!payload || !openaiWs || openaiWs.readyState !== WebSocket.OPEN)
          return;
        if (!streamSid)
          streamSid = data.streamSid ?? data.media?.streamSid ?? streamSid;
        const pcm8k = Buffer.from(payload, "base64");
        const pcm24k = resample8kTo24k(pcm8k);
        const b64 = pcm24k.toString("base64");
        if (openaiReady) {
          openaiWs.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: b64,
            }),
          );
        } else {
          audioQueue.push(b64);
        }
      } else if (data.event === "stop") {
        console.log(`[Exotel] Call stop for hospital: ${hospital.name}`);
        appointmentDetails =
          parseAppointmentFromTranscript(callTranscript, callerPhone) ||
          (callTranscript.some((t) =>
            /appointment|book|hospital|dr\./i.test(t.text),
          )
            ? {
                hospital: hospital._id.toString(),
                hospitalName: hospital.name,
                doctorName: null,
                patientName: null,
                patientAge: null,
                phone: callerPhone !== "unknown" ? callerPhone : null,
                preferredDate: null,
                preferredTime: null,
                callEndedAt: new Date().toISOString(),
              }
            : null);

        // Ensure hospital ID is set in appointment details
        if (appointmentDetails && !appointmentDetails.hospital) {
          appointmentDetails.hospital = hospital._id.toString();
          appointmentDetails.hospitalName = hospital.name;
        }

        const callSummary = {
          hospitalId: hospital._id.toString(),
          hospitalName: hospital.name,
          callTranscript,
          appointmentDetails: appointmentDetails || {
            status: "no_appointment",
            callEndedAt: new Date().toISOString(),
          },
          callerPhone: callerPhone !== "unknown" ? callerPhone : null,
          streamSid,
        };
        try {
          //   const fs = require("fs");
          //   const path = require("path");
          //   const dir = path.join(process.cwd(), "call_logs");
          //   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          //   const filename = path.join(
          //     dir,
          //     `call_${streamSid || Date.now()}_${Date.now()}.json`,
          //   );
          //   fs.writeFileSync(
          //     filename,
          //     JSON.stringify(callSummary, null, 2),
          //     "utf8",
          //   );
          //   callSummaryWritten = true;
          //   console.log(
          //     "[Exotel] Call transcript and appointment JSON saved:",
          //     filename,
          //   );
          console.log(
            `[Exotel] Call stop for ${hospital.name}. (No auto-create on stop)`,
          );
        } catch (e) {
          console.error("[Exotel] Failed to write call JSON:", e);
          console.log(
            "[Exotel] Call summary (inline):",
            JSON.stringify(callSummary, null, 2),
          );
        }
        cleanupOpenAI();
        ws.close();
      }
    } catch (e) {
      console.error("[Exotel] Message error:", e);
    }
  });

  ws.on("close", () => {
    console.log("[Exotel] WebSocket disconnected");
    if (!callSummaryWritten && callTranscript.length > 0) {
      let details = appointmentDetails;
      if (!details) {
        details = parseAppointmentFromTranscript(callTranscript, callerPhone);
        if (
          !details &&
          callTranscript.some((t) =>
            /appointment|book|hospital|dr\./i.test(t.text),
          )
        ) {
          details = {
            hospital: null,
            doctorName: null,
            patientName: null,
            patientAge: null,
            phone: callerPhone !== "unknown" ? callerPhone : null,
            preferredDate: null,
            preferredTime: null,
            callEndedAt: new Date().toISOString(),
          };
        }
      }
      const callSummary = {
        hospitalId: hospital._id.toString(),
        hospitalName: hospital.name,
        callTranscript,
        appointmentDetails: details || {
          status: "no_appointment",
          callEndedAt: new Date().toISOString(),
        },
        callerPhone: callerPhone !== "unknown" ? callerPhone : null,
        streamSid,
      };
      try {
        const fs = require("fs");
        const path = require("path");
        const dir = path.join(process.cwd(), "call_logs");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const filename = path.join(
          dir,
          `call_${streamSid || Date.now()}_${Date.now()}.json`,
        );
        fs.writeFileSync(
          filename,
          JSON.stringify(callSummary, null, 2),
          "utf8",
        );
        callSummaryWritten = true;
        console.log(
          "[Exotel] Call transcript and appointment JSON saved (on close):",
          filename,
        );
      } catch (e) {
        console.error("[Exotel] Failed to write call JSON:", e);
      }
    }
    cleanupOpenAI();
  });

  ws.on("error", (err) => {
    console.error("[Exotel] WebSocket error:", err);
    cleanupOpenAI();
  });
});

// =========================
// Health / root
// =========================
app.get("/", (req, res) => {
  res.send(
    "Chat-bot Voice Agent (Exotel + OpenAI Realtime). Connect to /media/:hospitalId via WebSocket.",
  );
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ success: true, service: "voice-agent" });
});

// List available hospitals endpoint (for debugging/config)
app.get("/hospitals", async (req, res) => {
  try {
    const PORT = env.AGENT_PORT || 5002;
    const CLOUDFLARE_DOMAIN = env.CLOUDFLARE_DOMAIN;

    const hospitals = await HospitalModel.find({})
      .select("_id name phoneNumber email address city pincode")
      .lean();

    // Get doctor counts for each hospital
    const hospitalsWithDoctors = await Promise.all(
      hospitals.map(async (h) => {
        const doctorCount = await DoctorModel.countDocuments({
          hospital: h._id,
        });
        const localWsUrl = `ws://localhost:${PORT}/media/${h._id}`;
        const cloudflareWsUrl = CLOUDFLARE_DOMAIN
          ? `wss://${CLOUDFLARE_DOMAIN}/media/${h._id}`
          : null;

        return {
          id: h._id.toString(),
          name: h.name,
          phoneNumber: h.phoneNumber,
          email: h.email,
          address: h.address,
          city: h.city,
          pincode: h.pincode,
          doctorCount,
          websocketUrl: localWsUrl,
          cloudflareUrl: cloudflareWsUrl,
          exotelUrl: cloudflareWsUrl || localWsUrl, // Preferred URL for Exotel
        };
      }),
    );

    res.json({
      success: true,
      data: {
        hospitals: hospitalsWithDoctors,
        cloudflareDomain: CLOUDFLARE_DOMAIN || null,
        note: CLOUDFLARE_DOMAIN
          ? "Use cloudflareUrl for Exotel production connections"
          : "Set CLOUDFLARE_DOMAIN in .env to get Cloudflare URLs",
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================
// Start server
// =========================
const startAgent = async () => {
  const PORT = env.AGENT_PORT || 5002;
  const CLOUDFLARE_DOMAIN = env.CLOUDFLARE_DOMAIN;

  // Fetch and log all hospitals from database at startup
  try {
    console.log("\n🏥 Loading hospitals from database...");
    const hospitals = await HospitalModel.find({})
      .select("_id name phoneNumber email address city pincode")
      .lean();

    if (hospitals.length === 0) {
      console.log(
        "   ⚠️  No hospitals found in database. Add hospitals to enable voice agent endpoints.",
      );
    } else {
      console.log(`   ✓ Found ${hospitals.length} hospital(s):\n`);

      // Get doctor counts and details for each hospital
      const hospitalsWithDetails = await Promise.all(
        hospitals.map(async (h) => {
          const doctors = await DoctorModel.find({ hospital: h._id })
            .select("fullName designation availability status")
            .lean();
          const doctorCount = doctors.length;

          // Group doctors by department
          const doctorsByDept = {};
          doctors.forEach((doc) => {
            const dept = doc.designation || "General";
            if (!doctorsByDept[dept]) {
              doctorsByDept[dept] = [];
            }
            doctorsByDept[dept].push(doc.fullName);
          });

          // Build WebSocket URLs (local and Cloudflare)
          const localWsUrl = `ws://0.0.0.0:${PORT}/media/${h._id}`;
          const cloudflareWsUrl = CLOUDFLARE_DOMAIN
            ? `wss://${CLOUDFLARE_DOMAIN}/media/${h._id}`
            : null;

          return {
            id: h._id.toString(),
            name: h.name,
            phoneNumber: h.phoneNumber,
            email: h.email,
            address: `${h.address}, ${h.city} - ${h.pincode}`,
            doctorCount,
            doctorsByDept,
            websocketUrl: localWsUrl,
            cloudflareUrl: cloudflareWsUrl,
          };
        }),
      );

      // Log each hospital with details
      hospitalsWithDetails.forEach((hospital, index) => {
        console.log(`   ${index + 1}. ${hospital.name}`);
        console.log(`      ID: ${hospital.id}`);
        console.log(`      Phone: ${hospital.phoneNumber}`);
        console.log(`      Email: ${hospital.email}`);
        console.log(`      Address: ${hospital.address}`);
        console.log(`      Doctors: ${hospital.doctorCount} available`);

        if (hospital.doctorCount > 0) {
          const deptList = Object.keys(hospital.doctorsByDept)
            .map((dept) => `${dept} (${hospital.doctorsByDept[dept].length})`)
            .join(", ");
          console.log(`      Departments: ${deptList}`);
        } else {
          console.log(`      ⚠️  No doctors assigned to this hospital`);
        }

        console.log(`      Local WebSocket: ${hospital.websocketUrl}`);
        if (hospital.cloudflareUrl) {
          console.log(`      🌐 Cloudflare URL: ${hospital.cloudflareUrl}`);
        }
        console.log("");
      });

      console.log(
        `📞 Chat-bot Voice Agent ready for ${hospitals.length} hospital(s)`,
      );

      // Show Exotel-ready endpoints (first 2 hospitals)
      if (hospitalsWithDetails.length > 0) {
        console.log("\n📱 Exotel Configuration Endpoints:");
        console.log(
          "   Configure these WebSocket URLs in your Exotel voice app:\n",
        );

        hospitalsWithDetails.slice(0, 2).forEach((hospital, index) => {
          const exotelUrl =
            hospital.cloudflareUrl ||
            hospital.websocketUrl.replace("0.0.0.0", "localhost");
          console.log(`   ${index + 1}. ${hospital.name}:`);
          console.log(`      WebSocket URL: ${exotelUrl}`);
          console.log(`      Hospital ID: ${hospital.id}`);
          console.log("");
        });

        if (hospitalsWithDetails.length > 2) {
          console.log(
            `   ... and ${hospitalsWithDetails.length - 2} more hospital(s)`,
          );
          console.log(`   Use GET /hospitals API to see all endpoints\n`);
        }

        if (!CLOUDFLARE_DOMAIN) {
          console.log("   ⚠️  CLOUDFLARE_DOMAIN not set in .env");
          console.log(
            "   Set CLOUDFLARE_DOMAIN=your-domain.com to get Cloudflare URLs\n",
          );
        }
      }
    }
  } catch (err) {
    console.error(`   ❌ Error loading hospitals: ${err.message}`);
    console.error(
      `   Agent will still start, but hospital validation may fail.`,
    );
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("\n📞 Chat-bot Voice Agent Server Started");
    console.log(`   Port: ${PORT}`);
    console.log(`   WebSocket Pattern: ws://0.0.0.0:${PORT}/media/:hospitalId`);
    if (CLOUDFLARE_DOMAIN) {
      console.log(
        `   Cloudflare Pattern: wss://${CLOUDFLARE_DOMAIN}/media/:hospitalId`,
      );
    }
    console.log(`   Health Check: http://0.0.0.0:${PORT}/health`);
    console.log(`   Hospitals API: http://0.0.0.0:${PORT}/hospitals`);
    console.log(
      `   Exotel: Use Cloudflare URLs above for production connections.\n`,
    );
  });
};

// Export the start function so it can be called from the main server
module.exports = { startAgent };

// If this file is run directly (not imported), start the agent server
if (require.main === module) {
  startAgent().catch((err) => {
    console.error("[Agent] Failed to start:", err);
    process.exit(1);
  });
  process.on("SIGINT", () => {
    console.log("\nShutting down...");
    process.exit(0);
  });
}
