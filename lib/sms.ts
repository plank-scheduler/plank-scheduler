export type SmsData = {
  name: string; email: string; phone: string;
  address: string; plan: string; service: string;
  datetime: string; notes?: string;
};
export async function sendNewBookingSMS(_: SmsData) {
  // SMS disabled (email only)
  return;
}
