// Edit this file to change the people on the cards.
// Portraits live in public/team/<n>.jpg; swap a file to change a photo.
export const TEAM = [
  { name: 'Scott Shi', role: 'Co-founder & CTO', photo: 'team/1.jpg' },
  { name: 'Cindy Shi', role: 'CMO', photo: 'team/2.jpg' },
  { name: 'Chi Zhang', role: 'Co-founder & CEO', photo: 'team/3.jpg' },
  { name: 'Henry Lee', role: 'Head of Ecosystem', photo: 'team/4.jpg' },
  { name: 'Laughing', role: 'APAC Lead', photo: 'team/5.jpg' },
];
export const bio = (p) =>
  `${p.role} at Kite AI, the payments layer for the agent economy.`;
