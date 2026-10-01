import { freshShoe, handTotal, isBlackjack, makeDeck, type Card, type Rank, type Suit } from "./cards";
import { deal, resolveInsurance, hit, stand, splitHand, doubleDown, createTable, dealerShouldHit, type Table } from "./blackjack";
import { act, bestHand, compareHands, options, reveal, startHand } from "./holdem";
import { covers, isLegal, settleRoulette, splitMates, cornersTouching, type BetKind } from "./roulette";
import { REELS, evaluateLine, type Lamp } from "./slots";
import { shuffle } from "./rng";

function c(r: Rank, s: Suit = "S"): Card {
  return { r, s };
}

function shoe(front: Card[]): Card[] {
  const pad: Card[] = [];
  while (front.length + pad.length < 90) pad.push(c("2", "C"));
  return [...front, ...pad];
}

function scripted(front: Card[]): Table {
  return { ...createTable(), shoe: shoe(front) };
}

function assert(cond: unknown, message: string, errors: string[]): void {
  if (!cond) errors.push(message);
}

export function runChecks(): string {
  const errors: string[] = [];
  const deck = makeDeck();
  assert(deck.length === 52, "deck size", errors);
  assert(new Set(deck.map((card) => card.r + card.s)).size === 52, "deck unique", errors);
  assert(shuffle(deck).length === 52, "shuffle length", errors);
  assert(freshShoe().length === 312, "shoe", errors);
  assert(handTotal([c("A"), c("K")]).total === 21, "blackjack total", errors);
  assert(handTotal([c("A"), c("A"), c("9")]).total === 21, "soft aces", errors);
  assert(!handTotal([c("A"), c("9"), c("9")]).soft, "hard 19", errors);
  assert(isBlackjack([c("A"), c("Q")]), "natural", errors);
  assert(!dealerShouldHit([c("A"), c("6")]), "stand soft 17", errors);
  assert(dealerShouldHit([c("A"), c("5")]), "hit 16", errors);

  const natural = deal(scripted([c("A"), c("9"), c("K"), c("7")]), 10);
  assert(natural.phase === "done", "natural skips play", errors);
  assert(natural.settlement?.mainReturn === 25, `natural pay ${natural.settlement?.mainReturn}`, errors);

  const both = deal(scripted([c("A"), c("A", "H"), c("K"), c("K", "H")]), 20);
  assert(both.phase === "insurance", "ace offers insurance", errors);
  const declined = resolveInsurance(both, false);
  assert(declined.settlement?.mainReturn === 20, "bj push returns stake", errors);
  const taken = resolveInsurance(both, true);
  assert(taken.insuranceBet === 10, "insurance half", errors);
  assert(taken.settlement?.insuranceReturn === 30, "insurance 2 to 1", errors);
  assert(taken.settlement?.mainReturn === 20, "main still pushes", errors);

  const peek = deal(scripted([c("9"), c("K", "H"), c("8"), c("A", "H")]), 10);
  assert(peek.phase === "done" && peek.settlement?.mainReturn === 0, "dealer peek", errors);

  const bust = hit(deal(scripted([c("K"), c("5"), c("6"), c("9"), c("Q")]), 10));
  assert(bust.phase === "done" && bust.settlement?.mainReturn === 0, "player bust", errors);
  assert(bust.dealer.length === 2, "dealer stands aside a bust", errors);

  const win = stand(deal(scripted([c("K"), c("9"), c("Q"), c("8")]), 10));
  assert(win.settlement?.mainReturn === 20, `20 vs 17 pays ${win.settlement?.mainReturn}`, errors);

  const split = splitHand(deal(scripted([c("8"), c("6"), c("8", "H"), c("9"), c("3"), c("K"), c("10")]), 10));
  assert(split.hands.length === 2, "split makes two hands", errors);
  assert(split.hands[0]?.cards[0]?.r === "8" && split.hands[0]?.cards[1]?.r === "3", "split draw order", errors);
  assert(split.phase === "player" && split.active === 0, "play left hand first", errors);

  const doubled = doubleDown(deal(scripted([c("5"), c("6"), c("6", "H"), c("9"), c("K")]), 10));
  assert(doubled.hands[0]?.bet === 20 && doubled.hands[0]?.cards.length === 3, "double takes one", errors);

  const royal = [c("A", "H"), c("K", "H"), c("Q", "H"), c("J", "H"), c("10", "H")];
  assert(bestHand(royal).key === "royal", "royal", errors);
  const wheel = [c("A"), c("2", "H"), c("3", "D"), c("4", "C"), c("5", "H")];
  assert(bestHand(wheel).key === "straight" && bestHand(wheel).score[1] === 5, "wheel", errors);
  const steel = [c("A", "H"), c("2", "H"), c("3", "H"), c("4", "H"), c("5", "H")];
  assert(bestHand(steel).key === "straightFlush", "steel wheel", errors);
  assert(bestHand([c("K"), c("K", "H"), c("9"), c("9", "H"), c("9", "D")]).key === "fullHouse", "boat", errors);
  const aces = bestHand([c("A"), c("A", "H"), c("K"), c("4"), c("2")]);
  const kings = bestHand([c("K"), c("K", "H"), c("A"), c("4"), c("2")]);
  assert(compareHands(aces, kings) > 0, "aces beat kings", errors);

  const scriptedDeck = (cards: Card[]) => {
    const pad: Card[] = [];
    while (cards.length + pad.length < 52) pad.push(c("2", "C"));
    return [...cards, ...pad];
  };
  const runOut = (table: ReturnType<typeof startHand>) => {
    let live = table;
    let guard = 0;
    while (live && live.status !== "done" && guard++ < 8) {
      if (live.status === "reveal") live = reveal(live);
      else break;
    }
    return live;
  };

  const open = startHand({ you: 1000, rail: 1000, button: 0, deck: scriptedDeck([c("A", "H"), c("7"), c("K"), c("2", "H")]) });
  assert(open?.toAct === 0 && open.streetBet[0] === 10 && open.streetBet[1] === 20, "sb acts first", errors);
  assert(open ? !options(open, 0).check && options(open, 0).call === 10 : false, "sb owes the blind", errors);
  const folded = open ? act(open, 0, { type: "fold" }) : null;
  assert(folded?.status === "done" && folded.stacks[0] === 990 && folded.stacks[1] === 1010, "fold gives the blinds", errors);
  assert(open ? act(open, 0, { type: "check" }) === open : false, "cannot check a blind", errors);

  const called = open ? act(open, 0, { type: "call" }) : null;
  const checked = called ? act(called, 1, { type: "check" }) : null;
  assert(checked?.board.length === 3 && checked.toAct === 1, "bb checks to the flop", errors);

  const race = startHand({
    you: 100,
    rail: 100,
    button: 0,
    deck: scriptedDeck([
      c("A", "H"),
      c("K", "D"),
      c("A", "D"),
      c("K", "S"),
      c("9", "C"),
      c("2", "C"),
      c("7", "D"),
      c("9", "H"),
      c("8", "C"),
      c("J", "C"),
      c("7", "C"),
      c("3", "S"),
    ]),
  });
  const shoved = race ? act(race, 0, { type: "bet", to: 100 }) : null;
  const calledOff = shoved ? act(shoved, 1, { type: "call" }) : null;
  const shown = runOut(calledOff);
  assert(shown?.status === "done" && shown.winner === 0 && shown.stacks[0] === 200 && shown.stacks[1] === 0, "aces hold", errors);

  const chop = startHand({
    you: 100,
    rail: 100,
    button: 0,
    deck: scriptedDeck([
      c("2", "C"),
      c("3", "D"),
      c("4", "C"),
      c("5", "D"),
      c("9", "C"),
      c("10", "H"),
      c("J", "H"),
      c("Q", "H"),
      c("8", "C"),
      c("K", "H"),
      c("7", "C"),
      c("A", "H"),
    ]),
  });
  const heroAll = chop ? act(chop, 0, { type: "bet", to: 100 }) : null;
  const railAll = heroAll ? act(heroAll, 1, { type: "call" }) : null;
  const chopped = runOut(railAll);
  assert(chopped?.winner === "split" && chopped.stacks[0] === 100 && chopped.stacks[1] === 100, "board royal splits", errors);
  assert(chopped?.youHand?.key === "royal", "both play the royal", errors);

  const six = startHand({ stacks: [500, 500, 500, 500, 500, 500], button: 0 });
  assert(six?.sbSeat === 1 && six.bbSeat === 2 && six.toAct === 3 && six.hole.every((hole) => hole.length === 2), "six-max deal", errors);
  const sixFold = six ? act(six, 3, { type: "fold" }) : null;
  assert(Boolean(sixFold?.folded[3]) && sixFold?.toAct === 4, "fold passes the turn", errors);

  assert(covers({ kind: "straight", n: 17 }, 17) && !covers({ kind: "straight", n: 17 }, 0), "straight", errors);
  assert(covers({ kind: "red" }, 32) && !covers({ kind: "red" }, 0) && !covers({ kind: "black" }, 0), "colors", errors);
  assert(covers({ kind: "dozen", d: 2 }, 13) && covers({ kind: "dozen", d: 2 }, 24), "dozen", errors);
  assert(covers({ kind: "column", c: 3 }, 36) && covers({ kind: "column", c: 1 }, 34), "columns", errors);
  assert(isLegal({ kind: "split", a: 1, b: 2 }) && !isLegal({ kind: "split", a: 1, b: 3 }), "split legal", errors);
  assert(cornersTouching(1).length === 1 && splitMates(5).length === 4, "neighbors", errors);
  const spin = settleRoulette(
    [
      { bet: { kind: "straight", n: 32 }, amount: 10 },
      { bet: { kind: "red" }, amount: 20 },
    ],
    32,
  );
  assert(spin.returned === 10 * 36 + 20 * 2, `roulette pay ${spin.returned}`, errors);
  const zero = settleRoulette([{ bet: { kind: "even" }, amount: 50 }], 0);
  assert(zero.returned === 0, "zero kills evens", errors);
  const street = settleRoulette([{ bet: { kind: "street", start: 1 } as BetKind, amount: 5 }], 3);
  assert(street.returned === 60, "street 11 to 1", errors);

  let stake = 0;
  let back = 0;
  for (let i = 0; i < 40000; i++) {
    const line = [0, 1, 2].map((reel) => {
      const strip = REELS[reel]!;
      return strip[Math.floor(Math.random() * strip.length)]!;
    }) as [Lamp, Lamp, Lamp];
    stake += 1;
    back += evaluateLine(line).mult;
  }
  const rtp = back / stake;
  assert(rtp > 0.8 && rtp < 1.05, `slot rtp ${rtp.toFixed(3)}`, errors);
  if (errors.length) throw new Error(errors.join("\n"));
  return `ok rtp ${rtp.toFixed(3)}`;
}
