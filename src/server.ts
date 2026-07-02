// Server-Einstieg: der Intake (nur aus Server-Actions/Route-Handlern importieren).
export { submitFeedback, createBoardIssue } from "./intake";
export { attachmentsFromFormData } from "./form-data";
export type {
  FeedbackConfig,
  IntakeInput,
  IntakeResult,
  IntakeKind,
  IntakeAttachment,
  IntakeTarget,
  FeedbackScope,
  CreateBoardIssueInput,
} from "./config";
