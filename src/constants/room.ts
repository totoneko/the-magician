// Default values for room creator settings
export const DEFAULT_ROOM_SETTINGS = {
  name: '',
  rule: {
    system: {
      round: 10,
      draw: {
        top: 2,
        override: 1,
        mulligan: 4,
      },
      handicap: {
        draw: true,
        cp: true,
        attack: true,
      },
      cp: {
        init: 2,
        increase: 1,
        max: 7,
        ceil: 12,
        carryover: false,
      },
    },
    player: {
      max: {
        life: 8,
        hand: 7,
        trigger: 4,
        field: 5,
      },
    },
    misc: {
      strictOverride: false,
      suicideJoker: false,
    },
    debug: {
      enable: true,
      reveal: {
        opponent: {
          deck: true,
          hand: true,
          trigger: true,
          trash: true,
        },
        self: {
          deck: true,
        },
      },
    },
  },
};
