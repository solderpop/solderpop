import React from 'react';
import { action } from '@storybook/addon-actions';

import '../src/core/styles/main.scss';
import Comment from '../src/project/components/Comment.jsx';

const baseProps = {
  id: 'my_comment_1',
  content: '',
  size: { width: 150, height: 100 },
  position: { x: 40, y: 30 },
  isSelected: false,
  isGhost: false,
  isDragged: false,
  hidden: false,
  onMouseDown: action('onMouseDown'),
  onResizeHandleMouseDown: action('onResizeHandleMouseDown'),
  onFinishEditing: action('onFinishEditing'),
};

const contentThatRequiresWordWrap = `
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
`;

const markdownContent = `
# Heading
[link](http://example.com)

pagagraphs must
be wrapped

- a list
- of many
- things

http://this-should-be-autolinked.com

![cirquit](https://solderpop.io/docs/tutorial/02-deploy/circuit.fz.png)
`;

export default {
  title: 'Comment',
  decorators: [
    (Story) => (
      <svg width="500" height="500">
        <rect width="100%" height="100%" fill="lightgrey" />
        <Story />
      </svg>
    ),
  ],
};

export const Default = () => (
  <Comment {...baseProps} content={contentThatRequiresWordWrap} />
);

export const MarkdownContent = () => (
  <Comment
    {...baseProps}
    content={markdownContent}
    size={{ width: 350, height: 420 }}
  />
);
