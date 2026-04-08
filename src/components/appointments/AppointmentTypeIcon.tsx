import type { LucideProps } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  CircleEllipsis,
  MessageCircle,
  Stethoscope,
  Video,
  PhoneCall,
} from "lucide-react";

/**
 * Maps API `type` strings (case-insensitive) to an icon.
 * Matches AddAppointmentModal: checkup, consultation, emergency, other, hospital, zoom.
 */
export function AppointmentTypeIcon({
  type,
  className = "w-4 h-4",
  ...props
}: {
  type: string | undefined | null;
  className?: string;
} & Omit<LucideProps, "ref">): JSX.Element {
  const key = (type ?? "").trim().toLowerCase();

  switch (key) {
    case "hospital":
      return <Building2 className={className} aria-hidden {...props} />;
    case "zoom":
      return <Video className={className} aria-hidden {...props} />;
    case "checkup":
      return <Stethoscope className={className} aria-hidden {...props} />;
    case "consultation":
      return <MessageCircle className={className} aria-hidden {...props} />;
    case "emergency":
      return <AlertTriangle className={className} aria-hidden {...props} />;
    case "call":
      return <PhoneCall className={className} aria-hidden {...props} />;
    case "other":
      return <CircleEllipsis className={className} aria-hidden {...props} />;
    default:
      return <CircleEllipsis className={className} aria-hidden {...props} />;
  }
}
