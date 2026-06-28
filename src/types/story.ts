export interface Page {
  text: string;
  illustration?: number;
  hasAudio: boolean;
  audioSource?: number;
}

export interface Story {
  id: string;
  title: string;
  coverArt?: number;
  readingTime: string;
  moral?: string;
  pages: Page[];
}
