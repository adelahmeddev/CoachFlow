import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  evenDistributionOffsets,
  autoAssignWeekdays,
  resolveWeekdays,
  toDateKey,
  addDaysToDateKey,
  buildFixedBoard,
  buildSequentialBoard,
  computeStreak,
  summarizeBoard,
  type BoardSplitDay,
  type BoardEntry,
} from "../src/lib/calculations/week-schedule"
import {
  findConflicts,
  suggestAlternative,
  SAFETY_TAGS,
  type ExerciseOption,
  type PainFlags,
} from "../src/lib/exercise-safety"
import { goalProgress } from "../src/lib/goals"
import { calcStreak } from "../src/lib/checkin"

describe("Week Schedule Calculations", () => {
  describe("evenDistributionOffsets", () => {
    it("returns empty array for non-positive count", () => {
      assert.deepEqual(evenDistributionOffsets(0), [])
      assert.deepEqual(evenDistributionOffsets(-2), [])
    })

    it("distributes 3 days evenly across a week", () => {
      // 0*7/3 = 0, 1*7/3 = 2.33 -> 2, 2*7/3 = 4.67 -> 5
      assert.deepEqual(evenDistributionOffsets(3), [0, 2, 5])
    })

    it("distributes 4 days evenly", () => {
      assert.deepEqual(evenDistributionOffsets(4), [0, 2, 4, 5])
    })
  })

  describe("weekdayForOffset and autoAssignWeekdays", () => {
    it("assigns correct days from SAT start", () => {
      const days = autoAssignWeekdays(3, "SAT")
      assert.deepEqual(days, ["SAT", "MON", "THU"])
    })

    it("assigns correct days from SUN start", () => {
      const days = autoAssignWeekdays(3, "SUN")
      assert.deepEqual(days, ["SUN", "TUE", "FRI"])
    })
  })

  describe("resolveWeekdays", () => {
    it("preserves explicitly assigned weekdays and fills unassigned", () => {
      const input = [
        { weekday: "SAT" as const },
        { weekday: null },
        { weekday: "THU" as const },
      ]
      const resolved = resolveWeekdays(input, "SAT")
      assert.equal(resolved[0], "SAT")
      assert.equal(resolved[2], "THU")
      assert.ok(resolved[1] !== null && resolved[1] !== "SAT" && resolved[1] !== "THU")
      // Ensure no duplicates
      const unique = new Set(resolved)
      assert.equal(unique.size, 3)
    })
  })

  describe("Date Key Math", () => {
    it("formats date to yyyy-mm-dd correctly", () => {
      const date = new Date(2026, 8, 14) // month is 0-indexed: 8 = Sep
      assert.equal(toDateKey(date), "2026-09-14")
    })

    it("adds days to dateKey without timezone drift across month/year boundaries", () => {
      assert.equal(addDaysToDateKey("2026-09-14", 5), "2026-09-19")
      assert.equal(addDaysToDateKey("2026-09-30", 1), "2026-10-01")
      assert.equal(addDaysToDateKey("2026-12-31", 1), "2027-01-01")
      assert.equal(addDaysToDateKey("2026-03-01", -1), "2026-02-28")
    })
  })

  describe("Boards and Streak Computation", () => {
    const splitDays: BoardSplitDay[] = [
      { id: "d1", dayNumber: 1, focus: "CHEST", weekday: "SAT" },
      { id: "d2", dayNumber: 2, focus: "BACK", weekday: "MON" },
      { id: "d3", dayNumber: 3, focus: "LEGS", weekday: "WED" },
    ]

    it("builds fixed board with 7 entries representing every day of the week", () => {
      const today = new Date(2026, 8, 14) // Sep 14, 2026 is Monday
      const logged = new Set(["2026-09-12"]) // Sat logged
      const board = buildFixedBoard(splitDays, "SAT", today, logged)
      assert.equal(board.length, 7)

      // Saturday (past, logged) -> DONE
      const sat = board.find((b) => b.weekday === "SAT")
      assert.equal(sat?.status, "DONE")
      assert.equal(sat?.done, true)

      // Monday (today) -> TODAY
      const mon = board.find((b) => b.weekday === "MON")
      assert.equal(mon?.status, "TODAY")

      // Sunday (rest)
      const sun = board.find((b) => b.weekday === "SUN")
      assert.equal(sun?.status, "REST")
      assert.equal(sun?.focus, "REST")
    })

    it("builds sequential board marking first unlogged as CURRENT", () => {
      const today = new Date(2026, 8, 14)
      const loggedByDayId = { d1: true }
      const board = buildSequentialBoard(splitDays, loggedByDayId, today)

      assert.equal(board.length, 3)
      assert.equal(board[0].status, "DONE")
      assert.equal(board[1].status, "CURRENT")
      assert.equal(board[2].status, "UPCOMING")
    })

    it("computes streak correctly in sequential mode", () => {
      const board: BoardEntry[] = [
        {
          key: "1",
          dayId: "d1",
          dayNumber: 1,
          focus: "A",
          customFocus: null,
          weekday: null,
          dateKey: "2026-09-12",
          status: "DONE",
          done: true,
          extraWorkout: false,
        },
        {
          key: "2",
          dayId: "d2",
          dayNumber: 2,
          focus: "B",
          customFocus: null,
          weekday: null,
          dateKey: "2026-09-13",
          status: "DONE",
          done: true,
          extraWorkout: false,
        },
        {
          key: "3",
          dayId: "d3",
          dayNumber: 3,
          focus: "C",
          customFocus: null,
          weekday: null,
          dateKey: "2026-09-14",
          status: "CURRENT",
          done: false,
          extraWorkout: false,
        },
      ]

      const streak = computeStreak(board, "SEQUENTIAL")
      assert.equal(streak, 2)
    })

    it("summarizeBoard produces planned, done, and streak", () => {
      const board: BoardEntry[] = [
        {
          key: "1",
          dayId: "d1",
          dayNumber: 1,
          focus: "A",
          customFocus: null,
          weekday: null,
          dateKey: "2026-09-12",
          status: "DONE",
          done: true,
          extraWorkout: false,
        },
        {
          key: "2",
          dayId: null,
          dayNumber: null,
          focus: "REST",
          customFocus: null,
          weekday: null,
          dateKey: "2026-09-13",
          status: "REST",
          done: false,
          extraWorkout: false,
        },
        {
          key: "3",
          dayId: "d2",
          dayNumber: 2,
          focus: "B",
          customFocus: null,
          weekday: null,
          dateKey: "2026-09-14",
          status: "TODAY",
          done: false,
          extraWorkout: false,
        },
      ]

      const summary = summarizeBoard(board, "FIXED")
      assert.equal(summary.planned, 2)
      assert.equal(summary.done, 1)
      assert.equal(summary.streak, 1)
    })
  })
})

describe("Exercise Safety Conflicts and Alternatives", () => {
  const library = new Map<string, ExerciseOption>([
    [
      "ex-squat",
      {
        id: "ex-squat",
        name: "Barbell Back Squat",
        nameAr: "سكوات بالبار",
        muscleGroup: "LEGS",
        equipment: "Barbell",
        tags: [SAFETY_TAGS.kneeLoad, SAFETY_TAGS.backLoad],
        defaultSets: 4,
        defaultReps: 8,
        defaultRestSeconds: 90,
        youtubeUrl: null,
      },
    ],
    [
      "ex-leg-press",
      {
        id: "ex-leg-press",
        name: "Leg Press",
        nameAr: "ليج بريس",
        muscleGroup: "LEGS",
        equipment: "Machine",
        tags: [SAFETY_TAGS.kneeLoad, SAFETY_TAGS.beginnerFriendly],
        defaultSets: 3,
        defaultReps: 12,
        defaultRestSeconds: 60,
        youtubeUrl: null,
      },
    ],
    [
      "ex-leg-extension",
      {
        id: "ex-leg-extension",
        name: "Leg Extension",
        nameAr: "تمديد ارجل",
        muscleGroup: "LEGS",
        equipment: "Machine",
        tags: [SAFETY_TAGS.beginnerFriendly],
        defaultSets: 3,
        defaultReps: 15,
        defaultRestSeconds: 60,
        youtubeUrl: null,
      },
    ],
    [
      "ex-overhead-press",
      {
        id: "ex-overhead-press",
        name: "Overhead Press",
        nameAr: "ضغط كتف بالبار",
        muscleGroup: "SHOULDERS",
        equipment: "Barbell",
        tags: [SAFETY_TAGS.shoulderLoad, SAFETY_TAGS.neckLoad],
        defaultSets: 4,
        defaultReps: 8,
        defaultRestSeconds: 90,
        youtubeUrl: null,
      },
    ],
  ])

  it("identifies backPain conflicts accurately", () => {
    const days = [
      {
        exercises: [{ exerciseId: "ex-squat", exerciseName: "Barbell Back Squat" }],
      },
    ]
    const pain: PainFlags = {
      neckPain: false,
      kneePain: false,
      backPain: true,
      shoulderPain: false,
    }

    const conflicts = findConflicts(days, library, pain)
    assert.equal(conflicts.length, 1)
    assert.equal(conflicts[0].exerciseId, "ex-squat")
    assert.equal(conflicts[0].reason, "backPain")
  })

  it("identifies multiple joint conflicts across exercises", () => {
    const days = [
      {
        exercises: [
          { exerciseId: "ex-squat", exerciseName: "Barbell Back Squat" },
          { exerciseId: "ex-overhead-press", exerciseName: "Overhead Press" },
        ],
      },
    ]
    const pain: PainFlags = {
      neckPain: true,
      kneePain: true,
      backPain: true,
      shoulderPain: true,
    }

    const conflicts = findConflicts(days, library, pain)
    // ex-squat has kneeLoad and backLoad -> 2 conflicts
    // ex-overhead-press has shoulderLoad and neckLoad -> 2 conflicts
    assert.equal(conflicts.length, 4)
  })

  it("suggests safe alternative with matching muscle group", () => {
    const pain: PainFlags = {
      neckPain: false,
      kneePain: true,
      backPain: true,
      shoulderPain: false,
    }

    // Replace ex-squat (LEGS). ex-leg-press has kneeLoad so conflict. ex-leg-extension has neither!
    const alt = suggestAlternative("ex-squat", library, pain)
    assert.ok(alt !== null)
    assert.equal(alt?.id, "ex-leg-extension")
    assert.equal(alt?.muscleGroup, "LEGS")
  })

  it("returns null when no safe alternative exists for muscle group", () => {
    const pain: PainFlags = {
      neckPain: true,
      kneePain: false,
      backPain: false,
      shoulderPain: true,
    }

    // Only one shoulder exercise exists, and it conflicts with shoulderPain
    const alt = suggestAlternative("ex-overhead-press", library, pain)
    assert.equal(alt, null)
  })
})

describe("Pure Goal and Streak Calculations Edge Cases", () => {
  it("handles goal regression past starting point gracefully", () => {
    // Started at 100, aimed for 80, but gained to 120
    assert.equal(goalProgress(100, 120, 80), 0)
    // Started at 60, aimed for 80, but dropped to 50
    assert.equal(goalProgress(60, 50, 80), 0)
  })

  it("handles goal overshoot past target gracefully", () => {
    // Started at 100, aimed for 80, reached 75
    assert.equal(goalProgress(100, 75, 80), 100)
    // Started at 60, aimed for 80, reached 85
    assert.equal(goalProgress(60, 85, 80), 100)
  })

  it("calculates streak correctly with month boundaries", () => {
    const streak = calcStreak(
      ["2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02"],
      "2026-09-02"
    )
    assert.equal(streak.current, 4)
    assert.equal(streak.checkedInToday, true)
  })
})
