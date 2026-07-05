import { render, fireEvent } from '@testing-library/react-native';
import { StoryEndFlow } from '@/components/StoryEndFlow';
import { Story } from '@/types/story';
import { VirtueReflection } from '@/data/virtue-reflections';

const story = { id: 's', title: 's', readingTime: '2 min', category: 'Courage', moral: 'Be brave.', pages: [] } as Story;
const reflection: VirtueReflection = {
  question: 'Would you try?',
  choices: [
    { label: 'Yes, try', feedback: 'Trying is brave.' },
    { label: 'Not now', feedback: 'That is okay too.' },
  ],
  talkStarters: ['When were you brave?'],
};

test('reflect -> feedback -> lesson sequence', () => {
  const { getByText, queryByText } = render(
    <StoryEndFlow story={story} reflection={reflection} isFavorite={false} onToggleFavorite={() => {}} onReadAnother={() => {}} />,
  );
  // reflect phase
  expect(getByText('Would you try?')).toBeTruthy();
  fireEvent.press(getByText('Yes, try'));
  // feedback phase
  expect(getByText('Trying is brave.')).toBeTruthy();
  fireEvent.press(getByText('Continue →'));
  // lesson phase
  expect(getByText('“Be brave.”')).toBeTruthy();
  expect(getByText('• When were you brave?')).toBeTruthy();
  expect(queryByText('Would you try?')).toBeNull();
});

test('starts at the lesson when there is no reflection', () => {
  const { getByText } = render(
    <StoryEndFlow story={story} isFavorite={false} onToggleFavorite={() => {}} onReadAnother={() => {}} />,
  );
  expect(getByText('“Be brave.”')).toBeTruthy();
});
