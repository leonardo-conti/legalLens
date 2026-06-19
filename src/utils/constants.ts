// Shared between the client (FileUpload) and the server (/api/ai) so the
// limit can't drift between where it's checked and where it's enforced.
export const MAX_DOCUMENT_LENGTH = 200_000; // characters
