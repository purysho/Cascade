# Cascade — Stage 5 human playtest protocol

Use this only for observed human sessions. Automated strategies and browser scripts are not substitutes for these observations.

## Minimum evidence

Observe at least:

1. one first-time player completing the four guided training exercises;
2. one full generated crisis played by a first-time or near-first-time player.

The same person may do both in one sitting.

## Observer rule

Do not coach unless the player is unable to continue for roughly one minute. Record the exact point where help was required before giving the smallest useful hint.

Do not explain the AI-safety theme before play. The purpose is to see whether the mechanics and interface communicate the causal problem themselves.

## Session A — first-time training

Record:

- start and finish time;
- which exercises required the Hint button;
- any instruction the player misread;
- whether the player notices the live AI order before committing;
- whether they can explain why repairing Grid prevents a downstream cascade;
- whether they understand why backup makes isolation safer;
- whether they can explain the difference between isolation and permanent oversight.

At the end ask, without leading:

> What is the main danger the city is dealing with?

Then:

> Why might shutting an AI-controlled service off immediately make things worse?

A useful comprehension signal is that the player mentions unchecked authority / unsafe optimisation and the loss of service capacity or dependencies. Do not score wording against a memorised phrase.

## Session B — full generated crisis

Use a fresh generated seed.

Record:

- seed;
- total play time;
- ending and ending round;
- number of times How to Play is opened;
- number of undo actions;
- tool(s) drafted and whether each was used;
- first service regulated;
- any round where the player could not explain the forecast;
- any cascade that surprised the player;
- whether the player can explain the decisive causal chain after the ending.

After the result screen ask:

> What caused the biggest problem in that run?

Then:

> If you played another seed, what would you change?

Finally ask:

> Do you want to try another generated crisis?

Record yes / no / maybe and the player's reason verbatim or in a close paraphrase.

## Observation form

| Field | Result |
| --- | --- |
| Date / tester code | |
| Browser / OS | |
| Training duration | |
| Training hints used | |
| Training confusion points | |
| Explained unchecked authority? | |
| Explained backup + isolation tradeoff? | |
| Full-crisis seed | |
| Full-crisis duration | |
| Ending / round | |
| First regulated service | |
| Tools drafted / used | |
| How-to opens | |
| Undo count | |
| Surprising cascade? | |
| Explained decisive causal chain? | |
| Wants another run? | |
| Most important quote / observation | |

## What counts as a Stage 5 finding

Treat repeated or blocking confusion as a product defect, not a tester defect.

Prioritise fixes when:

- the objective is misunderstood after training;
- players cannot tell forecast from committed outcome;
- backup/isolation is repeatedly misread;
- a cascade feels arbitrary because the dependency cue is not noticed;
- players cannot identify why they lost;
- important controls are unreachable at ordinary desktop sizes or zoom;
- a strategy or tool appears obviously dominant across observed runs.

Do not add mechanics just because a player loses. Fix comprehension first, then only change balance when observed decisions and outcomes justify it.

## Evidence status

Until a real session is completed, report human enjoyment, first-time comprehension, actual match duration, subjective audio mix and replay desire as **untested**.
