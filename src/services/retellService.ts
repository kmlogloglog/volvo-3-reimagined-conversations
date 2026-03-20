const RETELL_API_KEY = import.meta.env.VITE_RETELL_API_KEY as string;
const RETELL_ENDPOINT = 'https://api.retellai.com/v2/create-phone-call';
const FROM_NUMBER = '+420910925028';
const AGENT_ID = 'agent_5efc59bf1a7f0d90768f378728';

export async function createTestDriveCall(
  toNumber: string,
  profileName: string,
): Promise<unknown> {
  const res = await fetch(RETELL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from_number: FROM_NUMBER,
      to_number: toNumber,
      agent_id: AGENT_ID,
      retell_llm_dynamic_variables: { name: profileName },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Retell API error ${String(res.status)}: ${text}`);
  }

  return res.json() as Promise<unknown>;
}
