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
import theBirthdayPencil from './stories/the-birthday-pencil.json';
import theBlueChalk from './stories/the-blue-chalk.json';
import theBrokenCrayon from './stories/the-broken-crayon.json';
import theChalkLine from './stories/the-chalk-line.json';
import theCupOfWater from './stories/the-cup-of-water.json';
import theEmptyChair from './stories/the-empty-chair.json';
import theHalfBuiltKite from './stories/the-half-built-kite.json';
import theLastBell from './stories/the-last-bell.json';
import theLastPage from './stories/the-last-page.json';
import theLastSeat from './stories/the-last-seat.json';
import theLateHomework from './stories/the-late-homework.json';
import theLostRibbon from './stories/the-lost-ribbon.json';
import theNewShoes from './stories/the-new-shoes.json';
import thePaperBoatRace from './stories/the-paper-boat-race.json';
import thePaperCrown from './stories/the-paper-crown.json';
import theQuietDrummer from './stories/the-quiet-drummer.json';
import theSmallBlueUmbrella from './stories/the-small-blue-umbrella.json';
import theSmallestLantern from './stories/the-smallest-lantern.json';
import theSmallestSeed from './stories/the-smallest-seed.json';
import theTornPage from './stories/the-torn-page.json';
import theTwoLunches from './stories/the-two-lunches.json';
import theWindowPlant from './stories/the-window-plant.json';
import theWindowSeat from './stories/the-window-seat.json';
import theWrongSong from './stories/the-wrong-song.json';

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
  assembleStory(theBirthdayPencil),
  assembleStory(theBlueChalk),
  assembleStory(theBrokenCrayon),
  assembleStory(theChalkLine),
  assembleStory(theCupOfWater),
  assembleStory(theEmptyChair),
  assembleStory(theHalfBuiltKite),
  assembleStory(theLastBell),
  assembleStory(theLastPage),
  assembleStory(theLastSeat),
  assembleStory(theLateHomework),
  assembleStory(theLostRibbon),
  assembleStory(theNewShoes),
  assembleStory(thePaperBoatRace),
  assembleStory(thePaperCrown),
  assembleStory(theQuietDrummer),
  assembleStory(theSmallBlueUmbrella),
  assembleStory(theSmallestLantern),
  assembleStory(theSmallestSeed),
  assembleStory(theTornPage),
  assembleStory(theTwoLunches),
  assembleStory(theWindowPlant),
  assembleStory(theWindowSeat),
  assembleStory(theWrongSong),
];

export function getStories(): Story[] {
  return stories;
}

export function getStory(id: string): Story | undefined {
  return stories.find((s) => s.id === id);
}

export default stories;
