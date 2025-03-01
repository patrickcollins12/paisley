import JSON5 from 'json5';

// Import as raw text
import rawLogos from './logos.json5?raw'; 

const logos = JSON5.parse(rawLogos);
export default logos;