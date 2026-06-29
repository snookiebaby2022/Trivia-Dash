export type ReactionEvent =
  | 'game_start'
  | 'first_correct'
  | 'first_wrong'
  | 'streak_3'
  | 'streak_5'
  | 'streak_7'
  | 'streak_10'
  | 'streak_broken'
  | 'close_answer'
  | 'fast_answer'
  | 'comeback'
  | 'final_question'
  | 'perfect_game'
  | 'photo_finish'
  | 'blowout'
  | 'upset'
  | 'game_over_win'
  | 'game_over_loss'
  | 'daily_complete'
  | 'new_high_score';

export interface HostReaction {
  line: string;
  emphasis: 'normal' | 'excited' | 'hype' | 'whisper';
  emoji: string;
}

export interface ReactionContext {
  playerName?: string;
  streak?: number;
  score?: number;
  opponentScore?: number;
}

const LINES: Record<ReactionEvent, Array<(ctx: ReactionContext) => HostReaction>> = {
  game_start: [
    (ctx) => ({
      line: name(ctx, "Welcome to Trivia Dash! Let's see what you've got!"),
      emphasis: 'excited',
      emoji: '🎙',
    }),
    (ctx) => ({
      line: name(ctx, "It's showtime! Ready to play?"),
      emphasis: 'excited',
      emoji: '🎬',
    }),
    (ctx) => ({
      line: name(ctx, "Alright, the lights are on and the crowd is ready. Let's go!"),
      emphasis: 'excited',
      emoji: '✨',
    }),
    (ctx) => ({
      line: name(ctx, "Here we go! Time to answer some questions!"),
      emphasis: 'normal',
      emoji: '🎯',
    }),
  ],

  first_correct: [
    (ctx) => ({
      line: name(ctx, "Nice start! That's the way to do it!"),
      emphasis: 'normal',
      emoji: '✅',
    }),
    (ctx) => ({
      line: name(ctx, "First one in the books! Good answer!"),
      emphasis: 'normal',
      emoji: '👏',
    }),
    (ctx) => ({
      line: name(ctx, "You're on the board!"),
      emphasis: 'normal',
      emoji: '🎯',
    }),
    (ctx) => ({
      line: name(ctx, "And we're off to a great start!"),
      emphasis: 'excited',
      emoji: '🚀',
    }),
  ],

  first_wrong: [
    (ctx) => ({
      line: name(ctx, "Ooh, not quite! Shake it off, there's more to play!"),
      emphasis: 'normal',
      emoji: '😅',
    }),
    (ctx) => ({
      line: name(ctx, "Tough break on that one. Don't worry, you'll get the next!"),
      emphasis: 'normal',
      emoji: '💪',
    }),
    (ctx) => ({
      line: name(ctx, "That one was a tricky one! Stay with me!"),
      emphasis: 'normal',
      emoji: '🤔',
    }),
  ],

  streak_3: [
    (ctx) => ({
      line: name(ctx, "Three in a row! You're heating up!"),
      emphasis: 'excited',
      emoji: '🔥',
    }),
    (ctx) => ({
      line: name(ctx, "On fire! Can you keep it going?"),
      emphasis: 'excited',
      emoji: '🔥',
    }),
    (ctx) => ({
      line: name(ctx, "The crowd loves it — three straight!"),
      emphasis: 'excited',
      emoji: '👏',
    }),
    (ctx) => ({
      line: name(ctx, "Three for three! Look at you go!"),
      emphasis: 'excited',
      emoji: '🔥',
    }),
  ],

  streak_5: [
    (ctx) => ({
      line: name(ctx, "Five in a row! You are UNSTOPPABLE!"),
      emphasis: 'hype',
      emoji: '💥',
    }),
    (ctx) => ({
      line: name(ctx, "FIVE STRAIGHT! The crowd is going wild!"),
      emphasis: 'hype',
      emoji: '🎉',
    }),
    (ctx) => ({
      line: name(ctx, "Incredible! Five correct in a row!"),
      emphasis: 'hype',
      emoji: '🌟',
    }),
    (ctx) => ({
      line: name(ctx, "Five! Count 'em! You're on another level!"),
      emphasis: 'hype',
      emoji: '🔥',
    }),
    (ctx) => ({
      line: name(ctx, "This is what we call a hot streak! Five straight!"),
      emphasis: 'hype',
      emoji: '💥',
    }),
  ],

  streak_7: [
    (ctx) => ({
      line: name(ctx, "SEVEN! You're absolutely on another planet right now!"),
      emphasis: 'hype',
      emoji: '🪐',
    }),
    (ctx) => ({
      line: name(ctx, "Seven straight! Is there anyone who can stop you?!"),
      emphasis: 'hype',
      emoji: '🤯',
    }),
    (ctx) => ({
      line: name(ctx, "I've never seen anything like this — SEVEN in a row!"),
      emphasis: 'hype',
      emoji: '👑',
    }),
    (ctx) => ({
      line: name(ctx, "The crowd is losing it! Seven correct answers straight!"),
      emphasis: 'hype',
      emoji: '🎉',
    }),
  ],

  streak_10: [
    (ctx) => ({
      line: name(ctx, "TEN STRAIGHT! You're a TRIVIA LEGEND!"),
      emphasis: 'hype',
      emoji: '🏆',
    }),
    (ctx) => ({
      line: name(ctx, "TEN! A PERFECT TEN! I can't believe what I'm seeing!"),
      emphasis: 'hype',
      emoji: '👑',
    }),
    (ctx) => ({
      line: name(ctx, "Double digits! TEN in a row! You're rewriting the record books!"),
      emphasis: 'hype',
      emoji: '💫',
    }),
    (ctx) => ({
      line: name(ctx, "This is HISTORY! TEN consecutive correct answers!"),
      emphasis: 'hype',
      emoji: '🏆',
    }),
  ],

  streak_broken: [
    (ctx) => ({
      line: name(ctx, "And the streak is over! But what a run that was!"),
      emphasis: 'normal',
      emoji: '💫',
    }),
    (ctx) => ({
      line: name(ctx, "Ah, the streak ends here. But you've still got this!"),
      emphasis: 'normal',
      emoji: '💪',
    }),
    (ctx) => ({
      line: name(ctx, "That run was something special. Time to start a new one!"),
      emphasis: 'normal',
      emoji: '🔄',
    }),
  ],

  close_answer: [
    (ctx) => ({
      line: "That was CLOSE! Just two seconds to spare!",
      emphasis: 'whisper',
      emoji: '😮',
    }),
    (ctx) => ({
      line: "Wow, you almost ran out of time! Heartbreaker!",
      emphasis: 'whisper',
      emoji: '💓',
    }),
    (ctx) => ({
      line: "Living dangerously! You got that one just in time!",
      emphasis: 'whisper',
      emoji: '😰',
    }),
    (ctx) => ({
      line: "The clock was NOT your friend there! But you got it!",
      emphasis: 'whisper',
      emoji: '⏱',
    }),
  ],

  fast_answer: [
    (ctx) => ({
      line: name(ctx, "Lightning fast! You didn't even need to think about that one!"),
      emphasis: 'excited',
      emoji: '⚡',
    }),
    (ctx) => ({
      line: name(ctx, "Blink and you'll miss it — instant answer!"),
      emphasis: 'excited',
      emoji: '🚀',
    }),
    (ctx) => ({
      line: name(ctx, "That was INSTANT! The crowd loves that speed!"),
      emphasis: 'excited',
      emoji: '💨',
    }),
  ],

  comeback: [
    (ctx) => ({
      line: name(ctx, "What a comeback! You were behind and now you're AHEAD!"),
      emphasis: 'hype',
      emoji: '🔄',
    }),
    (ctx) => ({
      line: name(ctx, "You just took the lead! This is incredible!"),
      emphasis: 'hype',
      emoji: '🚀',
    }),
    (ctx) => ({
      line: name(ctx, "From behind to the front! The crowd is going CRAZY!"),
      emphasis: 'hype',
      emoji: '🔥',
    }),
  ],

  final_question: [
    (ctx) => ({
      line: "This is it. Last question. Everything rides on this.",
      emphasis: 'whisper',
      emoji: '🎯',
    }),
    (ctx) => ({
      line: "One more. Take a breath. You've got this.",
      emphasis: 'whisper',
      emoji: '💪',
    }),
    (ctx) => ({
      line: "The final question. The crowd is holding its breath.",
      emphasis: 'whisper',
      emoji: '🤫',
    }),
    (ctx) => ({
      line: "Here it is. The last one. Make it count.",
      emphasis: 'whisper',
      emoji: '🎯',
    }),
  ],

  perfect_game: [
    (ctx) => ({
      line: name(ctx, "A PERFECT GAME! Every single answer correct! ABSOLUTELY BRILLIANT!"),
      emphasis: 'hype',
      emoji: '👑',
    }),
    (ctx) => ({
      line: name(ctx, "FLAWLESS VICTORY! You got every single one right!"),
      emphasis: 'hype',
      emoji: '🏆',
    }),
    (ctx) => ({
      line: name(ctx, "PERFECT! Not a single miss! The crowd is STANDING!"),
      emphasis: 'hype',
      emoji: '⭐',
    }),
  ],

  photo_finish: [
    (ctx) => ({
      line: name(ctx, "Photo finish! You won by the SLIMMEST margin!"),
      emphasis: 'hype',
      emoji: '📸',
    }),
    (ctx) => ({
      line: name(ctx, "By THAT close! What an incredible finish!"),
      emphasis: 'hype',
      emoji: '😮',
    }),
    (ctx) => ({
      line: name(ctx, "That went down to the wire! You pulled it off!"),
      emphasis: 'hype',
      emoji: '🎊',
    }),
  ],

  blowout: [
    (ctx) => ({
      line: name(ctx, "Absolute DOMINATION! No contest on this one!"),
      emphasis: 'hype',
      emoji: '💥',
    }),
    (ctx) => ({
      line: name(ctx, "Total blowout! You left them in the dust!"),
      emphasis: 'hype',
      emoji: '🏆',
    }),
    (ctx) => ({
      line: name(ctx, "That was a masterclass! Not even close!"),
      emphasis: 'hype',
      emoji: '👑',
    }),
  ],

  upset: [
    (ctx) => ({
      line: name(ctx, "What an UPSET! The underdog takes it!"),
      emphasis: 'hype',
      emoji: '😱',
    }),
    (ctx) => ({
      line: name(ctx, "Nobody saw that coming! What a result!"),
      emphasis: 'hype',
      emoji: '🤯',
    }),
    (ctx) => ({
      line: name(ctx, "The biggest upset of the season! Incredible!"),
      emphasis: 'hype',
      emoji: '🔥',
    }),
  ],

  game_over_win: [
    (ctx) => ({
      line: name(ctx, "Winner! That was a masterclass!"),
      emphasis: 'hype',
      emoji: '🏆',
    }),
    (ctx) => ({
      line: name(ctx, "You did it! What a performance!"),
      emphasis: 'hype',
      emoji: '🎉',
    }),
    (ctx) => ({
      line: name(ctx, "Victory! The crowd is on their feet for you!"),
      emphasis: 'hype',
      emoji: '👑',
    }),
    (ctx) => ({
      line: name(ctx, "YOU WIN! That was absolutely fantastic!"),
      emphasis: 'hype',
      emoji: '🎊',
    }),
  ],

  game_over_loss: [
    (ctx) => ({
      line: name(ctx, "Not your day, but you put up a great fight!"),
      emphasis: 'normal',
      emoji: '💪',
    }),
    (ctx) => ({
      line: name(ctx, "That one got away from you. But you'll bounce back!"),
      emphasis: 'normal',
      emoji: '🔄',
    }),
    (ctx) => ({
      line: name(ctx, "Tough loss, but you showed real skill out there!"),
      emphasis: 'normal',
      emoji: '👏',
    }),
  ],

  daily_complete: [
    (ctx) => ({
      line: name(ctx, "That's your daily challenge done! Great work today!"),
      emphasis: 'excited',
      emoji: '📅',
    }),
    (ctx) => ({
      line: name(ctx, "Daily challenge complete! You crushed it today!"),
      emphasis: 'excited',
      emoji: '⭐',
    }),
    (ctx) => ({
      line: name(ctx, "Another daily challenge conquered! See you tomorrow!"),
      emphasis: 'excited',
      emoji: '🎯',
    }),
  ],

  new_high_score: [
    (ctx) => ({
      line: name(ctx, "NEW HIGH SCORE! You just set a personal best!"),
      emphasis: 'hype',
      emoji: '🏅',
    }),
    (ctx) => ({
      line: name(ctx, "That's a NEW RECORD for you! Incredible!"),
      emphasis: 'hype',
      emoji: '🎊',
    }),
    (ctx) => ({
      line: name(ctx, "You just beat your own high score! What a moment!"),
      emphasis: 'hype',
      emoji: '📈',
    }),
  ],
};

function name(ctx: ReactionContext, line: string): string {
  if (ctx.playerName) {
    return `${ctx.playerName}, ${line.charAt(0).toLowerCase()}${line.slice(1)}`;
  }
  return line;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getReaction(
  event: ReactionEvent,
  context?: ReactionContext
): HostReaction {
  const ctx = context ?? {};
  const pool = LINES[event];
  return pick(pool)(ctx);
}
