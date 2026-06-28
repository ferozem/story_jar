import { Story } from '@/types/story';
import { assembleStory } from './story-assembler';

import tornMap from './stories/the-torn-map.json';
import lockedBox from './stories/the-locked-suggestion-box.json';
import forgottenDiary from './stories/the-forgotten-diary.json';
import brokenLantern from './stories/the-broken-lantern.json';
import hilltopTrail from './stories/the-hilltop-trail.json';
import boyNearGate from './stories/the-boy-near-the-gate.json';
import theTrailMarkerPromise from './stories/the-trail-marker-promise.json';
import theKindnessRound from './stories/the-kindness-round.json';
import theSpilledPaintPlan from './stories/the-spilled-paint-plan.json';
import theButtonVolcano from './stories/the-button-volcano.json';
import theLastMangoSlice from './stories/the-last-mango-slice.json';
import theFinishLineWaterBottle from './stories/the-finish-line-water-bottle.json';
import theWaterTeam from './stories/the-water-team.json';
import theFairgroundHelper from './stories/the-fairground-helper.json';
import theMedalHeDidNotWin from './stories/the-medal-he-did-not-win.json';
import theCartWithTheWrongBox from './stories/the-cart-with-the-wrong-box.json';
import theHonestPrinterProblem from './stories/the-honest-printer-problem.json';
import theSharedLeaderPlan from './stories/the-shared-leader-plan.json';
import theLunchboxApology from './stories/the-lunchbox-apology.json';
import theBookmarkStall from './stories/the-bookmark-stall.json';
import theQuietCleanup from './stories/the-quiet-cleanup.json';
import theSecretBeforeBlame from './stories/the-secret-before-blame.json';
import theBraveBreath from './stories/the-brave-breath.json';
import theMapCaptain from './stories/the-map-captain.json';
import theMissingThankYou from './stories/the-missing-thank-you.json';
import theGoodThingsList from './stories/the-good-things-list.json';
import theBackwardBadge from './stories/the-backward-badge.json';
import theMangoLine from './stories/the-mango-line.json';
import theKiteOnTheBalcony from './stories/the-kite-on-the-balcony.json';
import theExtraSamosa from './stories/the-extra-samosa.json';
import theLibraryWhisper from './stories/the-library-whisper.json';
import theBlueRibbonRace from './stories/the-blue-ribbon-race.json';
import theExtraTenRupees from './stories/the-extra-ten-rupees.json';
import theBorrowedCompass from './stories/the-borrowed-compass.json';
import theBlueWaterBottle from './stories/the-blue-water-bottle.json';
import thePromiseAtTheGate from './stories/the-promise-at-the-gate.json';
import theCrookedBadge from './stories/the-crooked-badge.json';

const stories: Story[] = [
  assembleStory(tornMap),
  assembleStory(lockedBox),
  assembleStory(forgottenDiary),
  assembleStory(brokenLantern),
  assembleStory(hilltopTrail),
  assembleStory(boyNearGate),
  assembleStory(theTrailMarkerPromise),
  assembleStory(theKindnessRound),
  assembleStory(theSpilledPaintPlan),
  assembleStory(theButtonVolcano),
  assembleStory(theLastMangoSlice),
  assembleStory(theFinishLineWaterBottle),
  assembleStory(theWaterTeam),
  assembleStory(theFairgroundHelper),
  assembleStory(theMedalHeDidNotWin),
  assembleStory(theCartWithTheWrongBox),
  assembleStory(theHonestPrinterProblem),
  assembleStory(theSharedLeaderPlan),
  assembleStory(theLunchboxApology),
  assembleStory(theBookmarkStall),
  assembleStory(theQuietCleanup),
  assembleStory(theSecretBeforeBlame),
  assembleStory(theBraveBreath),
  assembleStory(theMapCaptain),
  assembleStory(theMissingThankYou),
  assembleStory(theGoodThingsList),
  assembleStory(theBackwardBadge),
  assembleStory(theMangoLine),
  assembleStory(theKiteOnTheBalcony),
  assembleStory(theExtraSamosa),
  assembleStory(theLibraryWhisper),
  assembleStory(theBlueRibbonRace),
  assembleStory(theExtraTenRupees),
  assembleStory(theBorrowedCompass),
  assembleStory(theBlueWaterBottle),
  assembleStory(thePromiseAtTheGate),
  assembleStory(theCrookedBadge),
];

export function getStories(): Story[] {
  return stories;
}

export function getStory(id: string): Story | undefined {
  return stories.find((s) => s.id === id);
}

export default stories;
