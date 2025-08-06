import axios from 'axios';

export async function generateListing(input) {
  const res = await axios.post('/api/generate', { input });
  return res.data;
}
