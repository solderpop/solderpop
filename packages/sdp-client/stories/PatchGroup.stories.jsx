import '../src/core/styles/main.scss';
import PatchGroup from '../src/projectBrowser/components/PatchGroup.jsx';

const ipsum = (
  <p style={{ color: '#CCC' }}>
    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus aperiam
    culpa deleniti eius eos incidunt labore magni minus neque obcaecati optio,
    possimus provident recusandae repellat vitae? Atque corporis excepturi
    neque.
  </p>
);

export default {
  title: 'PatchGroup',
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', backgroundColor: 'tomato' }}>
        <p>some content to see the top border</p>
        <Story />
      </div>
    ),
  ],
};

export const Library = () => (
  <PatchGroup name="Hello" type="library">
    {ipsum}
  </PatchGroup>
);

export const My = () => (
  <PatchGroup name="Hello" type="my">
    {ipsum}
  </PatchGroup>
);

export const SeveralAtOnce = () => (
  <div>
    <PatchGroup name="Group 1" type="my">
      {ipsum}
    </PatchGroup>
    <PatchGroup name="Group 2" type="library">
      {ipsum}
    </PatchGroup>
    <PatchGroup name="Group 3" type="library">
      {ipsum}
    </PatchGroup>
  </div>
);
