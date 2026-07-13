import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ContentProvider, useCatalogVersion } from '@/state/ContentProvider';
import { getStories } from '@/data/stories';

function Probe() {
  const version = useCatalogVersion();
  return <Text>{`${version}:${getStories().length}`}</Text>;
}

test('ContentProvider renders bundled catalog immediately and exposes a version', async () => {
  const { getByText } = render(
    <ContentProvider>
      <Probe />
    </ContentProvider>,
  );
  await waitFor(() => {
    // bundled snapshot has all stories; version string is non-empty before the colon
    expect(getByText(/.+:\d+$/)).toBeTruthy();
  });
});
