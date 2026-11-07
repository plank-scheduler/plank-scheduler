// Public referral identifiers. These grant no staff access.
export const referrers=[
  {
    "id": 4,
    "name": "Jacob Plank",
    "firstName": "Jacob",
    "code": "jacob-8fbd4603c189543c9d"
  },
  {
    "id": 17,
    "name": "Jedidiah Plank",
    "firstName": "Jedidiah",
    "code": "jedidiah-957868bac31c5ca69b"
  },
  {
    "id": 12,
    "name": "Josh Plank",
    "firstName": "Josh",
    "code": "josh-a9a1451dc9b6431c1b"
  }
] as const;
export function referrerByCode(code:unknown){return referrers.find(t=>t.code===code)??null;}
