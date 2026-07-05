import { StoryCategory } from '@/types/story';

export interface ReflectionChoice {
  label: string;
  feedback: string;
}

export interface VirtueReflection {
  question: string;
  choices: [ReflectionChoice, ReflectionChoice];
  talkStarters: string[];
}

export const VIRTUE_REFLECTIONS: Record<StoryCategory, VirtueReflection> = {
  'Honesty & Trust': {
    question: 'You broke something by accident and no one saw. What would you do?',
    choices: [
      { label: 'Tell what happened', feedback: 'Telling the truth takes courage — and people trust you even more for it.' },
      { label: 'Stay quiet', feedback: 'It can feel easier to stay quiet — but telling the truth is what builds trust, even when it is hard.' },
    ],
    talkStarters: [
      'When is telling the truth hardest for you?',
      'How do you feel when someone is honest with you?',
    ],
  },
  'Humility & Service': {
    question: 'You did something helpful and someone else got the thanks. What would you do?',
    choices: [
      { label: 'Keep helping anyway', feedback: 'Helping because it is kind — not for the thanks — is what real service looks like.' },
      { label: 'Say it was you', feedback: 'It is okay to want to be noticed — and helping quietly, without needing credit, is a quiet kind of strong.' },
    ],
    talkStarters: [
      'When have you helped without anyone noticing?',
      'How does it feel to help someone just because?',
    ],
  },
  'Kindness & Compassion': {
    question: 'A new kid is sitting alone and looks sad. What would you do?',
    choices: [
      { label: 'Go sit with them', feedback: 'One kind hello can change someone’s whole day.' },
      { label: 'Wait for someone else', feedback: 'It can feel scary to go first — and even a small smile can help someone feel less alone.' },
    ],
    talkStarters: [
      'When has someone been kind to you when you felt alone?',
      'What is one kind thing you could do tomorrow?',
    ],
  },
  'Sharing & Generosity': {
    question: 'You have one treat left and a friend has none. What would you do?',
    choices: [
      { label: 'Share it', feedback: 'Sharing what you have, even when it is little, is a big-hearted thing to do.' },
      { label: 'Keep it', feedback: 'It is okay to enjoy your own things — and sharing can make a moment even better for both of you.' },
    ],
    talkStarters: [
      'How does it feel when someone shares with you?',
      'What is something you could share this week?',
    ],
  },
  'Forgiveness': {
    question: 'A friend broke your toy and said sorry. What would you do?',
    choices: [
      { label: 'Forgive them', feedback: 'Forgiving does not mean it did not hurt — it means you choose to stay friends.' },
      { label: 'Stay angry', feedback: 'Your feelings are real — and holding on to anger often hurts you most. Forgiving sets you free too.' },
    ],
    talkStarters: [
      'Is it harder to say sorry, or to forgive? Why?',
      'How do you feel after you forgive someone?',
    ],
  },
  'Patience': {
    question: 'Something you really want is taking a long time. What would you do?',
    choices: [
      { label: 'Wait calmly', feedback: 'Good things often take time — waiting is a quiet kind of strength.' },
      { label: 'Give up', feedback: 'It is okay to feel frustrated — but sticking with it a little longer often makes it worth the wait.' },
    ],
    talkStarters: [
      'What is something you had to wait a long time for?',
      'What helps you feel calm while you wait?',
    ],
  },
  'Courage': {
    question: 'You are scared to try something new in front of others. What would you do?',
    choices: [
      { label: 'Take a breath and try', feedback: 'Being brave does not mean not being scared — it means trying anyway.' },
      { label: 'Sit it out', feedback: 'It is okay to feel nervous — and every small try makes the next one easier.' },
    ],
    talkStarters: [
      'When were you brave, even though you felt scared?',
      'What is one brave thing you would like to try?',
    ],
  },
  'Fairness': {
    question: 'You are picking teams and one friend is always chosen last. What would you do?',
    choices: [
      { label: 'Pick them early', feedback: 'Making sure everyone gets a fair chance is what fairness is all about.' },
      { label: 'Pick the best players', feedback: 'Wanting to win is normal — and making the game fair for everyone makes it better for all.' },
    ],
    talkStarters: [
      'When has something felt unfair to you?',
      'How can you help make things fair for others?',
    ],
  },
  'Gratitude & Contentment': {
    question: 'A friend got something new that you wish you had. What would you do?',
    choices: [
      { label: 'Be happy for them', feedback: 'Noticing the good things you already have brings a quiet, happy kind of peace.' },
      { label: 'Feel jealous', feedback: 'It is normal to wish for things — and remembering what you are thankful for helps the jealous feeling fade.' },
    ],
    talkStarters: [
      'What are three things you are thankful for today?',
      'How does it feel to be happy for someone else?',
    ],
  },
};
