// Server-Einstieg: der Intake (nur aus Server-Actions/Route-Handlern importieren).
export { submitFeedback } from "./intake";
export { attachmentsFromFormData } from "./form-data";
export type {
  FeedbackConfig,
  IntakeInput,
  IntakeResult,
  IntakeKind,
  IntakeAttachment,
  IntakeTarget,
  FeedbackScope,
} from "./config";
