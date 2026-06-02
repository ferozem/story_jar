export interface Page {
  text: string;
  illustration?: number;
  audio?: number;
}

export interface Story {
  id: string;
  title: string;
  coverArt: number;
  readingTime: string;
  pages: Page[];
}
