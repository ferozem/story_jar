import { render, fireEvent } from '@testing-library/react-native';
import { LessonScreen } from '@/components/LessonScreen';

test('renders moral, talk starters, and fires callbacks', () => {
  const onToggle = jest.fn();
  const onAnother = jest.fn();
  const { getByText, queryByText } = render(
    <LessonScreen
      moral="Be kind."
      talkStarters={['Question one?', 'Question two?']}
      isFavorite={false}
      onToggleFavorite={onToggle}
      onReadAnother={onAnother}
    />,
  );
  expect(getByText('“Be kind.”')).toBeTruthy();
  expect(getByText('👋 For grown-ups')).toBeTruthy();
  expect(getByText('• Question one?')).toBeTruthy();
  fireEvent.press(getByText('♡ Save to My Jar'));
  expect(onToggle).toHaveBeenCalled();
  fireEvent.press(getByText('Read another story'));
  expect(onAnother).toHaveBeenCalled();
});

test('omits the moral when none is given', () => {
  const { queryByText } = render(
    <LessonScreen
      talkStarters={['Just a starter?']}
      isFavorite
      onToggleFavorite={() => {}}
      onReadAnother={() => {}}
    />,
  );
  expect(queryByText(/“/)).toBeNull();
  expect(queryByText('• Just a starter?')).toBeTruthy();
});
