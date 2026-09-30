'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Clock, ChevronRight, Lightbulb, Volume2, VolumeX, Loader2, ExternalLink } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

const CHILD_INFO: Record<string, { name: string; grade: number }> = {
  jus: { name: 'Jus', grade: 5 },
  uni: { name: 'Uni', grade: 8 },
}

const SUBJECT_NEXT: Record<string, string | null> = {
  math:       'reading',
  reading:    'science',
  science:    'ai',
  ai:         'finance',
  finance:    'law',
  law:        'health',
  health:     null,
  // Wing subjects — no forced chain
  philosophy: null,
  history:    null,
  sociology:  null,
  political:  null,
  arduino:    null,
  deeplearn:  null,
  arts:       null,
}

const SUBJECT_LABEL: Record<string, string> = {
  math:       'Mathematics',
  reading:    'Reading & Writing',
  science:    'Science',
  ai:         'AI Literacy',
  finance:    'Finance Literacy',
  law:        'Law & Rights',
  health:     'Health & Body',
  philosophy: 'Philosophy',
  history:    'World History',
  sociology:  'Society & Poverty',
  political:  'Political Science',
  arduino:    'Arduino & Making',
  deeplearn:  'Deep Learning & AI',
  arts:       'Arts & Culture',
}

// Each subject maps to a full OpenStax book in the content-spine
const SUBJECT_BOOKS: Record<string, { primary: string; label: string; secondary?: string }> = {
  math:       { primary: 'college-algebra',       label: 'College Algebra' },
  reading:    { primary: 'writing-guide',          label: 'Writing Guide' },
  science:    { primary: 'biology',                label: 'Biology 2e', secondary: 'physics' },
  ai:         { primary: 'introduction-business',  label: 'Introduction to Business' },
  finance:    { primary: 'finance',                label: 'Principles of Finance 2e', secondary: 'economics' },
  law:        { primary: 'business-law',           label: 'Business Law', secondary: 'american-government' },
  health:     { primary: 'anatomy-physiology',     label: 'Anatomy & Physiology', secondary: 'psychology' },
  philosophy: { primary: 'philosophy',             label: 'Introduction to Philosophy' },
  history:    { primary: 'world-history',          label: 'World History' },
  sociology:  { primary: 'sociology',              label: 'Introduction to Sociology', secondary: 'psychology' },
  political:  { primary: 'political-science',      label: 'Introduction to Political Science', secondary: 'american-government' },
  arduino:    { primary: 'introduction-business',  label: 'Intro to Business (Arduino coming)' },
  deeplearn:  { primary: 'biology',                label: 'Biology (D2L deep-learn wire coming)' },
  arts:       { primary: 'writing-guide',          label: 'Writing & Culture' },
}

// Starting chapter index per book per grade (0-indexed)
const GRADE_CHAPTER_START: Record<string, Record<number, number>> = {
  'college-algebra':       { 5: 0, 6: 2, 7: 4, 8: 6, 9: 8,  10: 10 },
  'writing-guide':         { 5: 0, 6: 3, 7: 6, 8: 9, 9: 12, 10: 15 },
  'biology':               { 5: 0, 6: 3, 7: 6, 8: 9, 9: 12, 10: 15 },
  'physics':               { 5: 0, 6: 2, 7: 4, 8: 6, 9: 8,  10: 10 },
  'introduction-business': { 5: 0, 6: 1, 7: 2, 8: 3, 9: 4,  10: 5  },
  'finance':               { 5: 0, 6: 1, 7: 2, 8: 3, 9: 5,  10: 7  },
  'economics':             { 5: 0, 6: 1, 7: 2, 8: 3, 9: 4,  10: 5  },
  'business-law':          { 5: 0, 6: 1, 7: 2, 8: 3, 9: 4,  10: 5  },
  'american-government':   { 5: 0, 6: 1, 7: 2, 8: 3, 9: 4,  10: 5  },
  'anatomy-physiology':    { 5: 0, 6: 2, 7: 4, 8: 6, 9: 8,  10: 10 },
  'psychology':            { 5: 0, 6: 1, 7: 2, 8: 3, 9: 4,  10: 5  },
  'philosophy':            { 5: 0, 6: 1, 7: 2, 8: 3, 9: 5,  10: 7  },
  'world-history':         { 5: 0, 6: 2, 7: 5, 8: 8, 9: 11, 10: 14 },
  'sociology':             { 5: 0, 6: 1, 7: 3, 8: 5, 9: 7,  10: 9  },
  'political-science':     { 5: 0, 6: 1, 7: 2, 8: 3, 9: 4,  10: 5  },
}

interface TocModule { id: string; title: string }
interface TocChapter { title: string; modules: TocModule[] }
interface Toc { book: string; bookTitle: string; chapters: TocChapter[]; totalModules: number }
interface ModuleContent { title: string; paragraphs: string[]; learningOutcomes: string[]; book: string; moduleId: string }

function todayKey(childId: string) {
  const d = new Date()
  return `daily_${childId}_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function markComplete(childId: string, subject: string) {
  const key = todayKey(childId)
  const existing = JSON.parse(localStorage.getItem(key) || '{}')
  existing[subject] = true
  localStorage.setItem(key, JSON.stringify(existing))
}

// ─── LESSON CONTENT ─────────────────────────────────────────────────────────

interface Lesson {
  title: string
  teach: string
  example: { problem: string; steps: string[]; answer: string }
  practice: { problem: string; hint: string; answer: string; acceptedAnswers: string[] }
}

const LESSONS: Record<string, Record<number, Lesson[]>> = {
  math: {
    5: [
      {
        title: 'Fractions: Adding and Comparing',
        teach: `A fraction has two parts: the numerator (top) and the denominator (bottom). The denominator tells you how many equal pieces something is cut into. The numerator tells you how many pieces you have.

To ADD fractions, you need the same denominator. Think of it like currency — you can't add dollars and euros without converting first.

Step 1: Find a number both denominators divide into evenly.
Step 2: Multiply each fraction so both have that denominator.
Step 3: Add the numerators. Keep the denominator.

Why does this work? Because fractions name pieces of a whole. You can't add thirds and sixths until they're the same size pieces.`,
        example: {
          problem: '1/2 + 1/4 = ?',
          steps: ['4 is the common denominator (2 × 2 = 4, 4 × 1 = 4)', 'Convert: 1/2 = 2/4', 'Add: 2/4 + 1/4 = 3/4'],
          answer: '3/4',
        },
        practice: {
          problem: 'A pizza is cut into 6 slices. Jus eats 2 slices and Uni eats 1 slice. What fraction of the pizza did they eat together?',
          hint: 'Both fractions already have the same denominator (sixths). Add the numerators.',
          answer: '1/2',
          acceptedAnswers: ['1/2', '3/6', '0.5', 'half'],
        },
      },
      {
        title: 'Area and Perimeter: Real Decisions',
        teach: `Area = how much SPACE is inside a shape. Measured in square units (cm², ft², m²).
Perimeter = the distance AROUND a shape. Add up all the sides.

For rectangles:
  Area = length × width
  Perimeter = 2 × (length + width)

The KEY: knowing WHICH one to use is the real skill.
— Buying paint or tiles → you need AREA (how much surface to cover)
— Buying fence or baseboard → you need PERIMETER (how much edge to wrap)

Most people get confused because they use the wrong measure for the problem.`,
        example: {
          problem: 'You want to put carpet in a 9ft × 6ft bedroom. The carpet costs $4 per square foot. What is the total cost?',
          steps: ['You need area because carpet covers the floor surface', 'Area = 9 × 6 = 54 sq ft', 'Cost = 54 × $4 = $216'],
          answer: '$216',
        },
        practice: {
          problem: 'You\'re fencing a rectangular yard that is 12m long and 5m wide. How many meters of fence do you need?',
          hint: 'You\'re going around the outside — that\'s perimeter, not area.',
          answer: '34',
          acceptedAnswers: ['34', '34m', '34 meters', '34 m'],
        },
      },
      {
        title: 'Reasoning with Numbers: Is That Reasonable?',
        teach: `The most important math skill isn't calculation — it's knowing if an answer MAKES SENSE.

Great mathematicians always ask: "Is this reasonable?"

The ESTIMATION PROCESS:
1. Round all numbers to something easy
2. Do the quick calculation in your head
3. Check if your exact answer is close to your estimate

If your exact answer and estimate are far apart — you made an error somewhere.

This is called a REASONABLENESS CHECK. Engineers, scientists, and businesspeople use it all the time because a wrong answer that looks right is the most dangerous kind.`,
        example: {
          problem: 'You buy 48 pencils at $0.89 each. Your calculator says $428.22. Is that reasonable?',
          steps: [
            'Estimate: 50 pencils × $1 = $50',
            'The calculator shows $428 — way off from $50',
            'There must be an input error — maybe typed 48 × 8.92 instead of 0.89',
          ],
          answer: 'Not reasonable. Correct answer is about $42.72.',
        },
        practice: {
          problem: 'A class of 32 students each need 3 notebooks. Someone says the total is 960 notebooks. Without a calculator — is that reasonable or not?',
          hint: 'Estimate: 30 × 3 = ? How does that compare to 960?',
          answer: 'not reasonable',
          acceptedAnswers: ['not reasonable', 'no', 'unreasonable', 'not right', 'wrong', 'no it is not'],
        },
      },
    ],
    8: [
      {
        title: 'Linear Equations: Modeling Real Problems',
        teach: `A linear equation isn't just a math puzzle — it's a TOOL for making decisions.

The rule: WHATEVER YOU DO TO ONE SIDE, DO TO THE OTHER.

But the real power is in SETTING UP the equation from a situation. That's the skill most people skip.

Two steps:
1. Identify what you don't know — that's your variable
2. Translate the words into math ("+", "total", "per" = multiply, "left over" = subtract)

Once it's set up, solving is mechanical. The thinking is in the setup.`,
        example: {
          problem: 'Plan A: $30 sign-up + $15/month. Plan B: $0 sign-up + $20/month. After how many months do they cost the same?',
          steps: [
            'Let m = number of months',
            'Plan A total = 30 + 15m',
            'Plan B total = 20m',
            'Set equal: 30 + 15m = 20m',
            'Subtract 15m: 30 = 5m',
            'Divide by 5: m = 6 months',
          ],
          answer: '6 months',
        },
        practice: {
          problem: 'A taxi charges $2.50 base fare + $1.50 per mile. The ride cost $11.50 total. How many miles was the ride?',
          hint: 'Let m = miles. Write: 2.50 + 1.50m = 11.50. Now solve for m.',
          answer: '6',
          acceptedAnswers: ['6', '6 miles', 'm=6', 'm = 6'],
        },
      },
      {
        title: 'The Pythagorean Theorem: When to Use It',
        teach: `In any RIGHT TRIANGLE:  a² + b² = c²
Where c is the HYPOTENUSE (the longest side, opposite the 90° angle).

The theorem has been proven over 370 different ways — it's one of the most verified facts in mathematics.

BUT the real skill is recognizing WHEN you're dealing with a right-triangle situation.
Signals: "how far is it diagonally?" / "what is the shortest path?" / "how high does it reach?"

Any time you have two measurements at 90° and need the third — Pythagorean theorem.`,
        example: {
          problem: 'A ladder leans against a wall. The base is 6 feet from the wall. The ladder reaches 8 feet up the wall. How long is the ladder?',
          steps: [
            'The wall and floor form a right angle — this IS a right triangle',
            'The ladder is the hypotenuse (c)',
            '6² + 8² = c²',
            '36 + 64 = 100',
            'c = √100 = 10 feet',
          ],
          answer: '10 feet',
        },
        practice: {
          problem: 'A ship sails 9 miles north, then 12 miles east. How far is it from where it started (straight line)?',
          hint: 'North and east form a right angle. The straight-line distance is the hypotenuse.',
          answer: '15',
          acceptedAnswers: ['15', '15 miles', 'c=15'],
        },
      },
      {
        title: 'Logic: What Makes an Argument Valid?',
        teach: `An argument is VALID when the conclusion MUST follow from the premises — even if the premises are false.

DEDUCTIVE REASONING: If premises are true, conclusion is guaranteed.
  Premise 1: All birds have wings.
  Premise 2: A penguin is a bird.
  Conclusion: Therefore, a penguin has wings. (Valid — even though penguins can't fly)

INDUCTIVE REASONING: Using specific examples to build a general rule. Not guaranteed — but can be strong or weak.
  "Every swan I've ever seen is white. Therefore all swans are white." — Was believed for centuries. Then black swans were found in Australia.

FALLACIES — common errors in reasoning:
  AD HOMINEM: Attacking the person instead of the argument. "You can't trust his idea — he failed math."
  STRAW MAN: Distorting someone's position to make it easier to attack.
  FALSE DICHOTOMY: "You're either with us or against us" — ignores middle ground.
  APPEAL TO AUTHORITY: "A celebrity says it's healthy, so it must be." Being famous ≠ being right.

Knowing these means you can't be tricked by them.`,
        example: {
          problem: 'Identify the fallacy: "Senator X said we need stricter environmental laws. But Senator X was caught littering last year — clearly she doesn\'t care about the environment."',
          steps: [
            'The argument attacks the Senator\'s personal behavior',
            'It does NOT address whether the environmental laws are good or bad',
            'The quality of her argument is separate from her personal life',
          ],
          answer: 'Ad hominem — attacking the person instead of the argument',
        },
        practice: {
          problem: 'What is it called when someone attacks the person making an argument instead of the argument itself?',
          hint: 'It\'s a Latin phrase. It means "to the person."',
          answer: 'ad hominem',
          acceptedAnswers: ['ad hominem', 'ad hominem fallacy', 'attacking the person', 'personal attack'],
        },
      },
    ],
  },
  reading: {
    5: [
      {
        title: 'Finding the Main Idea',
        teach: `Every paragraph — and every piece of writing — has a MAIN IDEA. It's what the whole thing is really about.

Finding it:
1. Read the whole paragraph.
2. Ask: "What is this mostly about?"
3. Look for a sentence that covers everything else (often the first or last).
4. Supporting details are facts, examples, or reasons that back up the main idea — they are NOT the main idea themselves.

Strong readers separate the big idea from the details that support it.`,
        example: {
          problem: '"Elephants are the largest land animals on Earth. They live in Africa and Asia. They can weigh up to 14,000 pounds. African elephants have large ears shaped like the continent of Africa." What is the main idea?',
          steps: ['Every sentence is a fact about elephants', 'All the details describe how large/where elephants are', 'The opening sentence covers the rest'],
          answer: 'Elephants are the largest land animals on Earth.',
        },
        practice: {
          problem: 'What do you call the sentences that give facts, examples, or reasons to back up the main idea?',
          hint: 'They "support" the main idea. Two words.',
          answer: 'supporting details',
          acceptedAnswers: ['supporting details', 'supporting detail', 'details', 'support details'],
        },
      },
      {
        title: 'Reading for Purpose: Why Did They Write This?',
        teach: `Every piece of writing has a PURPOSE. The author wants you to DO something — believe something, feel something, buy something, vote for something.

The three main purposes:
INFORM — share facts and knowledge without trying to convince you
PERSUADE — change your mind or get you to act
ENTERTAIN — engage your imagination or emotions

But here's what they don't always tell you: PERSUASIVE writing often looks like informative writing.

Ask these two questions:
1. Who wrote this and why?
2. What do they want me to think or do after reading?

A company writing about its own product is not giving you neutral information. A politician's website is not a news article. Being a strong reader means knowing the difference.`,
        example: {
          problem: '"Our all-natural juice contains no added sugar and has been shown to boost energy levels." Who might have written this, and what is their purpose?',
          steps: [
            'The language "our" suggests the juice company wrote it',
            'It highlights positives only — no negatives mentioned',
            'Purpose: to persuade you to buy the juice',
            'Critical question: "shown by whom?" — studies by the company itself may not be independent',
          ],
          answer: 'Persuasive — written to sell the product. The evidence needs independent verification.',
        },
        practice: {
          problem: 'A friend says "I read online that this vitamin cures colds." What\'s the first question you should ask to evaluate that claim?',
          hint: 'Think about the SOURCE of the information. Where did it come from and why?',
          answer: 'who wrote it',
          acceptedAnswers: ['who wrote it', 'where did they read it', 'what is the source', 'who published it', 'what website', 'the source'],
        },
      },
      {
        title: 'Fact vs. Opinion: The Invisible Line',
        teach: `A FACT is something that can be tested and proven true or false.
An OPINION is what someone believes, feels, or values.

The tricky part: opinions are often written to SOUND like facts.

FACT: "The temperature dropped 12 degrees last night." (Measurable)
OPINION: "It's too cold to go outside." (Depends on who you ask)
OPINION DRESSED AS FACT: "Studies show that most people prefer warm climates." (Which studies? Most people where?)

Signals that something is an opinion:
  — "I think," "I believe," "In my opinion"
  — "Best," "worst," "most important," "should" (value words)
  — Vague numbers: "many," "most," "experts say"

Why it matters: If you can't tell fact from opinion, you can be led to believe anything.`,
        example: {
          problem: 'Which is the fact and which is the opinion? A) "Soccer is the world\'s most popular sport." B) "Soccer is the most exciting sport to watch."',
          steps: [
            'A) "Most popular" can be measured by viewership and player counts — this is verifiable data → FACT',
            'B) "Most exciting" is subjective — it depends on what the person finds exciting → OPINION',
          ],
          answer: 'A = Fact (measurable). B = Opinion (subjective value judgment).',
        },
        practice: {
          problem: '"Everyone knows that reading books is better for you than watching TV." Is this a fact or opinion? Why?',
          hint: 'Look for value words. Can you actually measure "better"?',
          answer: 'opinion',
          acceptedAnswers: ['opinion', 'an opinion', 'it is an opinion'],
        },
      },
    ],
    8: [
      {
        title: 'Argument Structure: Claim, Evidence, Reasoning',
        teach: `Every strong argument has three parts:

CLAIM: What you believe is true. A clear statement that can be argued.
EVIDENCE: Facts, data, examples, or quotes that support your claim.
REASONING: The explanation of WHY the evidence proves the claim.

The missing piece in most weak arguments is the REASONING. Students give evidence but forget to explain the connection. "Studies show X" is not an argument — "Studies show X, which means Y because Z" is.

When you read someone else's argument, find their claim first, then ask: what evidence do they use, and does the reasoning actually hold up?`,
        example: {
          problem: 'Identify the three parts: "Schools should start later (C) because teenagers\' brains produce melatonin until 8am (E), meaning waking at 6am forces learning during peak sleep time, reducing retention (R)."',
          steps: ['Claim: Schools should start later', 'Evidence: Melatonin production until 8am (biological fact)', 'Reasoning: This creates a mismatch that hurts learning'],
          answer: 'Claim → Evidence → Reasoning, connected with "because" and "meaning"',
        },
        practice: {
          problem: 'What is the part of an argument that explains WHY the evidence actually proves the claim?',
          hint: 'It comes after the evidence. It starts with "this means..." or "therefore..."',
          answer: 'reasoning',
          acceptedAnswers: ['reasoning', 'the reasoning', 'reason', 'warrant'],
        },
      },
      {
        title: 'How to Evaluate a Source',
        teach: `Not all information is equal. The source matters as much as the content.

The SIFT method (Stop, Investigate, Find, Trace):

STOP — Before sharing or believing: pause. Does this seem designed to make you angry or afraid? Those emotions shut down critical thinking.

INVESTIGATE the source — Who runs this site? Do they have a financial or political interest in what they're saying?

FIND better coverage — Is this story reported by multiple independent outlets? If only one source is reporting it, be skeptical.

TRACE claims to originals — News articles often cite studies. Find the actual study. What did it actually say? Was the original sample 12 people? Was it funded by an interested party?

THE GOLDEN STANDARD: peer-reviewed, replicated research with no conflicts of interest. Everything below that is a lower grade of evidence.`,
        example: {
          problem: 'A headline says "Scientists Prove Coffee Causes Cancer." A friend shares it and says you should stop drinking coffee. What do you do?',
          steps: [
            'STOP: "Causes" is a strong word — scientists rarely prove cause in a single study',
            'INVESTIGATE: Who published the study? Was it peer-reviewed?',
            'FIND: Are other researchers saying the same thing, or is this one outlier study?',
            'TRACE: Read the actual study. Was it in mice at 50x normal doses? Many "cancer" headlines are like this.',
          ],
          answer: 'Read the actual study. One study ≠ scientific consensus. Check sample size, dose, and funding.',
        },
        practice: {
          problem: 'A supplement company publishes a study showing their own product prevents illness. What is the problem with using this as evidence?',
          hint: 'Think about who paid for the research and what they would gain from a positive result.',
          answer: 'conflict of interest',
          acceptedAnswers: ['conflict of interest', 'biased', 'the company funded it', 'they have a financial interest', 'not independent', 'bias'],
        },
      },
      {
        title: 'Recognizing Manipulation in Language',
        teach: `Powerful writing can shape what you believe without you realizing it. The tools:

LOADED LANGUAGE: Words chosen to trigger an emotional response rather than inform.
  "Freedom fighters" vs "terrorists" — same people, different framing.
  "Tax relief" vs "tax cuts" — same policy. "Relief" implies taxes are a burden.

FALSE DICHOTOMY: Presenting only two options when more exist.
  "You're either with us or you're against us." (There are many middle positions.)

BANDWAGON: "Everyone is doing it / believing it — you should too."
  Truth is not decided by majority vote.

CHERRY-PICKING: Citing only evidence that supports your position, ignoring contradicting evidence.
  "Three people said the drug worked." (What about the fifty who said it didn't?)

SLIPPERY SLOPE: "If we allow X, eventually Y and Z will happen." Without showing the actual steps.

Knowing these means you can read ANY text — ad, speech, article — and see the mechanics.`,
        example: {
          problem: '"If we lower the voting age to 16, next they\'ll want children deciding wars, then toddlers running for president." Identify the technique.',
          steps: [
            'The argument goes from a reasonable policy change (16-year-olds voting) to an absurd extreme (toddlers running)',
            'It doesn\'t show WHY those steps would follow',
            'This is a SLIPPERY SLOPE — assuming extreme consequences without logical steps connecting them',
          ],
          answer: 'Slippery slope fallacy — jumps to extreme conclusions without proving the chain of causation.',
        },
        practice: {
          problem: 'An advertisement says "9 out of 10 dentists recommend this toothpaste." What is the key question you should ask before believing this?',
          hint: 'Think about what information is being hidden and what "recommend" might really mean.',
          answer: 'which dentists',
          acceptedAnswers: ['which dentists', 'which 10 dentists', 'how were the dentists selected', 'who funded the survey', 'what did they actually say', 'what does recommend mean'],
        },
      },
    ],
  },
  science: {
    5: [
      {
        title: 'Ecosystems: Energy Flow and What Happens When It Breaks',
        teach: `An ecosystem is all the living things in an area AND the non-living things they depend on (water, soil, air, sunlight). Everything is connected.

ENERGY flows through ecosystems in a food chain:
Sun → Producers (plants) → Primary Consumers (herbivores) → Secondary Consumers (carnivores) → Decomposers

Key rules:
- Energy is LOST at each step (~90%). A cow eats 10 kg of grass but only adds 1 kg to its body.
- This is why there are far more plants than deer, and far more deer than wolves.
- Remove one part of the chain and the WHOLE system changes.

CRITICAL THINKING APPLICATION:
When you hear "wolves were reintroduced to Yellowstone," that's not just about wolves. It changed deer behavior, which changed where deer grazed, which allowed riverbanks to recover, which changed the rivers themselves. One species → ecosystem-wide cascade.

This is called a TROPHIC CASCADE. Understanding it is understanding how systems work.`,
        example: {
          problem: 'A meadow has grass, rabbits, foxes, and bacteria in the soil. Foxes are hunted to extinction. What happens over time?',
          steps: [
            'No foxes → rabbit population explodes (nothing controlling it)',
            'Too many rabbits → grass is overgrazed and disappears',
            'No grass → rabbits starve, population crashes',
            'Bare land → erosion, other species lose habitat',
          ],
          answer: 'Removing the fox causes a cascade: rabbit explosion → grass collapse → system failure.',
        },
        practice: {
          problem: 'In a food chain, energy is lost at each step. So which level has the most available energy: producers, primary consumers, or secondary consumers?',
          hint: 'Energy flows from the sun downward and is lost at each step. The first level gets the most.',
          answer: 'producers',
          acceptedAnswers: ['producers', 'the producers', 'plants', 'grass', 'producer level'],
        },
      },
      {
        title: 'The Scientific Method: How We Know What We Know',
        teach: `Science isn't a collection of facts. Science is a METHOD for finding out what's true.

The steps:
1. OBSERVATION — notice something interesting or unexpected
2. QUESTION — ask why or how it happens
3. HYPOTHESIS — your best guess at an explanation (must be testable)
4. EXPERIMENT — test it in a way where you change ONE thing at a time
5. DATA — record results honestly, even if they contradict your hypothesis
6. CONCLUSION — does the data support, refute, or complicate the hypothesis?
7. PEER REVIEW — other scientists try to prove you wrong

A hypothesis is NOT a guess — it's an educated prediction with a reason.
WRONG: "I think plants grow better with music."
RIGHT: "If plants respond to sound vibrations, then plants exposed to consistent 440Hz tones will show greater stem growth than controls, because vibrations may stimulate cell wall activity."

The hardest part: accepting data that proves your hypothesis wrong. That's not failure — that's science working correctly.`,
        example: {
          problem: 'A student says "I gave my plant extra water and it grew taller. So extra water makes plants grow." What is the problem with this conclusion?',
          steps: [
            'Only ONE plant was tested — no control group',
            'Many other variables could have changed (sunlight, temperature, soil)',
            'You need to test many plants with ONLY water as the variable that changes',
            'The conclusion needs to be tested and replicated before it holds',
          ],
          answer: 'No control group, too small a sample, other variables not controlled. Not a valid scientific conclusion.',
        },
        practice: {
          problem: 'A scientist changes the temperature AND the light level in the same experiment. What rule did they break?',
          hint: 'In a valid experiment, how many variables should you change at once?',
          answer: 'one',
          acceptedAnswers: ['one', 'one variable', 'only one', 'they changed two variables', 'you should only change one variable'],
        },
      },
      {
        title: 'Forces, Motion, and Newton\'s Three Laws',
        teach: `Everything that moves — or doesn't move — is explained by THREE laws Newton figured out in 1687. They still work perfectly for anything you can see or touch.

LAW 1 — INERTIA: An object at rest stays at rest. An object in motion stays in motion at the same speed and direction — UNLESS an outside force acts on it.
  Why does a car skid on ice? Less friction = less outside force = the car keeps going its original direction.
  Why do you lurch forward when a bus stops? Your body wants to keep moving forward while the bus stops under you.

LAW 2 — FORCE: Force = Mass × Acceleration (F = ma)
  More force → more acceleration.
  More mass → less acceleration from the same force.
  A bowling ball and a ping pong ball thrown with the same force have very different speeds.

LAW 3 — ACTION/REACTION: Every action has an equal and opposite reaction.
  A rocket pushes gas downward → gas pushes the rocket upward.
  You push the ground with your feet → the ground pushes you forward.

These three laws describe planets, cars, sports, and everyday life equally. Newton didn't know about atoms or quantum physics — but his laws work for everything at human scale.`,
        example: {
          problem: 'A 1,000kg car and a 100kg motorcycle have the same engine applying 10,000 N of force. Which accelerates faster? How much faster?',
          steps: [
            'F = ma → a = F/m',
            'Car: a = 10,000 / 1,000 = 10 m/s²',
            'Motorcycle: a = 10,000 / 100 = 100 m/s²',
            'The motorcycle accelerates 10x faster — same force, 10x less mass',
          ],
          answer: 'The motorcycle: 100 m/s² vs 10 m/s². 10 times faster because it has 10 times less mass.',
        },
        practice: {
          problem: 'A rocket launches by burning fuel and pushing exhaust gases downward. According to Newton\'s Third Law, what happens to the rocket?',
          hint: 'Every action (gases pushed down) has an equal and opposite reaction.',
          answer: 'the rocket is pushed upward',
          acceptedAnswers: ['the rocket is pushed upward', 'rocket goes up', 'it goes up', 'it launches up', 'it accelerates upward'],
        },
      },
      {
        title: 'Chemistry: Atoms, Elements, and the Periodic Table',
        teach: `Everything — your body, the air, this screen — is made of atoms. Understanding atoms is understanding the universe's building blocks.

ATOM:
— Protons (+ charge) and neutrons in the NUCLEUS (centre)
— Electrons (- charge) orbiting in shells around the nucleus
— The number of protons = the ATOMIC NUMBER = which element it is
  1 proton = Hydrogen. 6 protons = Carbon. 79 protons = Gold.

THE PERIODIC TABLE:
— Organizes all 118 known elements by atomic number
— Elements in the same COLUMN (group) have similar properties because they have the same number of electrons in their outer shell
— Outer shell electrons are what determine chemistry — they're what bonds form with

CHEMICAL BONDS:
— COVALENT: atoms share electrons (water H₂O — oxygen and hydrogen share electrons)
— IONIC: one atom gives electrons to another (table salt NaCl — sodium gives an electron to chlorine, creating + and - charges that attract)

WHY IT MATTERS:
Your entire biology is chemistry. DNA is a molecule. Proteins are molecules. Every thought is electrochemical signals made of atoms. Understanding atoms = understanding life.`,
        example: {
          problem: 'Carbon has 6 protons. Nitrogen has 7. Silicon has 14. What do these numbers tell you?',
          steps: [
            'The number of protons = the atomic number = which element it is',
            'Carbon: 6 protons → atomic number 6 → it IS carbon, always',
            'Nitrogen: 7 protons → any atom with 7 protons is nitrogen — no exceptions',
            'This is why nuclear reactions can transmute elements: change the proton count, change the element',
          ],
          answer: 'Each element is defined by its proton count. Carbon always has 6, nitrogen always 7, silicon always 14.',
        },
        practice: {
          problem: 'What subatomic particle determines which element an atom is?',
          hint: 'It\'s in the nucleus. It has a positive charge.',
          answer: 'proton',
          acceptedAnswers: ['proton', 'protons', 'the proton', 'number of protons'],
        },
      },
    ],
    8: [
      {
        title: 'Cells: What the Evidence Actually Tells Us',
        teach: `All life is made of cells. But how do we KNOW that? And how was it figured out?

The Cell Theory wasn't declared — it was built from evidence across decades:
- 1665: Robert Hooke looked at cork under a microscope. Saw tiny "rooms." Called them cells.
- 1838: Matthias Schleiden: all plants are made of cells.
- 1839: Theodor Schwann: all animals are made of cells.
- 1855: Rudolf Virchow: cells only come from pre-existing cells.

Each step required a new tool (microscope improvements) and a willingness to challenge previous beliefs.

PROKARYOTES vs EUKARYOTES:
PROKARYOTES (bacteria, archaea): No membrane-bound nucleus. DNA floats freely. Simpler, older.
EUKARYOTES (plants, animals, fungi): Have a nucleus. Have organelles. More complex.

The endosymbiotic theory: your mitochondria were once free-living bacteria that were absorbed by a larger cell ~2 billion years ago. Evidence: mitochondria have their own DNA, their own ribosomes, they reproduce independently. This was controversial when proposed in 1967 — now it's consensus.`,
        example: {
          problem: 'A scientist finds a single-celled organism with no nucleus but with its own DNA. What is it, and what domain does it belong to?',
          steps: [
            'No nucleus = prokaryote',
            'Prokaryotes belong to Bacteria or Archaea',
            'Has its own DNA — consistent with prokaryote characteristics',
            'Further tests (membrane lipids, ribosomal RNA) would determine which domain',
          ],
          answer: 'Prokaryote — likely Bacteria or Archaea. More tests needed to determine which.',
        },
        practice: {
          problem: 'The endosymbiotic theory says mitochondria were once free-living bacteria. Name ONE piece of evidence that supports this.',
          hint: 'Think about what mitochondria have that normal organelles don\'t.',
          answer: 'their own dna',
          acceptedAnswers: ['their own dna', 'own dna', 'mitochondria have their own dna', 'own ribosomes', 'they reproduce independently', 'separate dna'],
        },
      },
      {
        title: 'Climate Science: Reading the Data',
        teach: `Climate change is one of the most important scientific topics of your lifetime. Understanding the evidence — not just the conclusions — is critical thinking in action.

THE EVIDENCE (not opinion — measurable data):
- Global average temperature is ~1.1°C higher than the pre-industrial average (NOAA, NASA, multiple independent datasets)
- CO₂ levels: 280ppm pre-industrial → 421ppm today (highest in 800,000 years of ice core data)
- Arctic sea ice extent has decreased ~13% per decade since 1979 (satellite data)
- Sea levels are rising ~3.7mm/year (satellite altimetry since 1993)

HOW WE KNOW CO₂ IS HUMAN-CAUSED:
Carbon has isotopes (C-12, C-13, C-14). Fossil fuels have a distinct isotopic signature. The increase in atmospheric CO₂ matches the fossil fuel signature — not volcanic or natural.

This is not a political statement. It is measurement. The debate is about what to DO — that is where values, economics, and politics enter.

Critical thinkers separate: what the data shows vs what policy to adopt.`,
        example: {
          problem: 'Someone says "Climate always changes naturally. The Medieval Warm Period was as warm as today without human CO₂. So this isn\'t unusual." Evaluate this claim.',
          steps: [
            'TRUE: Climate does change naturally (orbital cycles, volcanic activity, solar variation)',
            'PARTLY FALSE: The Medieval Warm Period was ~0.5°C warmer in some regions — not globally equivalent to today',
            'MISSING: The rate of current warming (very fast by geological standards) + the CO₂ isotopic signature',
            'Conclusion: The claim cherry-picks. Natural change happens, but current evidence points to human cause at current speed.',
          ],
          answer: 'Partially true but cherry-picked. Ignores rate of change and isotopic evidence.',
        },
        practice: {
          problem: 'What is the name for when an argument selects only the evidence that supports its position while ignoring contradicting evidence?',
          hint: 'It\'s also used in statistics — picking only the data that favors you.',
          answer: 'cherry picking',
          acceptedAnswers: ['cherry picking', 'cherry-picking', 'cherry pick', 'cherry-pick', 'confirmation bias', 'selective evidence'],
        },
      },
      {
        title: 'Genetics: DNA, Inheritance, and Why You Are You',
        teach: `You are made of approximately 37 trillion cells. In almost every cell's nucleus is a complete copy of your genome — 3 billion base pairs of DNA, organized into 23 pairs of chromosomes.

DNA STRUCTURE:
— Double helix: two strands wrapped around each other
— Made of four bases: A (adenine), T (thymine), G (guanine), C (cytosine)
— A always pairs with T. G always pairs with C.
— The sequence of these bases is the code — instructions for building proteins

THE GENE:
A gene is a stretch of DNA that codes for a protein. Humans have ~20,000 genes. Proteins do everything: build your body, carry oxygen (hemoglobin), defend against viruses (antibodies), control metabolism.

INHERITANCE (Mendel's laws):
— You inherit ONE chromosome from each parent for each pair
— DOMINANT allele: one copy is enough to express the trait
— RECESSIVE allele: need two copies to express it
— If you have one dominant and one recessive: you're a CARRIER — you don't show the trait but can pass it on

MUTATION:
A change in the DNA sequence. Most are silent or neutral. Some are harmful. A few are beneficial — these are the raw material of evolution. Cancer is caused by mutations in genes controlling cell division.`,
        example: {
          problem: 'Brown eyes (B) is dominant over blue eyes (b). One parent has genotype Bb. The other has genotype bb. What fraction of children will have blue eyes?',
          steps: [
            'Cross Bb × bb: possible children are Bb, Bb, bb, bb',
            'bb genotype = blue eyes (recessive, two copies needed)',
            '2 out of 4 children have genotype bb = 50% chance of blue eyes',
          ],
          answer: '50% of children will have blue eyes (bb genotype).',
        },
        practice: {
          problem: 'In genetics, what do you call someone who has one recessive allele and can pass a trait to offspring without showing it themselves?',
          hint: 'They "carry" the gene but don\'t express it.',
          answer: 'carrier',
          acceptedAnswers: ['carrier', 'a carrier', 'genetic carrier'],
        },
      },
      {
        title: 'Physics: Energy, Thermodynamics, and Why Perpetual Motion Is Impossible',
        teach: `Energy cannot be created or destroyed — only converted from one form to another. This is the First Law of Thermodynamics. It sounds simple. The implications are enormous.

FORMS OF ENERGY:
— Kinetic (motion), Potential (stored/position), Thermal (heat), Chemical (food/fuel), Electrical, Nuclear
— All are the same thing in different forms. They convert between each other.
  Burning food: chemical → thermal + kinetic (muscle movement)
  Hydroelectric dam: potential (water height) → kinetic (falling) → electrical

THE SECOND LAW — ENTROPY:
Every energy conversion wastes some energy as low-quality heat. The universe tends toward disorder.

WHY PERPETUAL MOTION IS IMPOSSIBLE:
Every machine loses energy to heat through friction and other losses. To run forever, it would need to create energy from nothing — violating the First Law. Every perpetual motion claim in history has been fraud or error. The laws of thermodynamics have zero known exceptions.

EFFICIENCY:
Car engine: ~25% (75% is waste heat)
Electric motor: ~90%
Human body: ~25% at converting food to mechanical work
The efficiency gap drives all energy research — waste heat is wasted money.`,
        example: {
          problem: 'A phone battery stores chemical energy. Trace the energy conversions when you play a video.',
          steps: [
            'Chemical energy in battery → electrical energy (discharge)',
            'Electrical → light (screen pixels emit photons)',
            'Electrical → kinetic energy (vibrating speaker = sound)',
            'Some electrical → heat (lost as inefficiency — phone warms up)',
          ],
          answer: 'Chemical → Electrical → Light + Sound + Heat. Energy is lost as heat at every step (entropy).',
        },
        practice: {
          problem: 'What law of thermodynamics states that energy cannot be created or destroyed, only converted from one form to another?',
          hint: 'It\'s the FIRST law.',
          answer: 'first law of thermodynamics',
          acceptedAnswers: ['first law of thermodynamics', 'the first law', 'first law', 'law of conservation of energy'],
        },
      },
    ],
  },
  finance: {
    5: [
      {
        title: 'What Money Does — and Why Saving Is Power',
        teach: `Money is a tool. It measures value and lets people exchange what they have for what they need. But most people only learn one trick: spend it.

There are three things you can do with money:
1. SPEND it — exchange it for something right now
2. SAVE it — hold it for later, so you have choices
3. INVEST it — put it somewhere it can grow while you do other things

The secret most kids don't hear until it's too late: money you don't spend grows.

If you earn $10 a week and save $3, after one year you have $156 saved. That $156 can buy things you could never buy in a single week, open a business, or grow even more. The person who saves $3/week has something the person who spent everything has: OPTIONS.

Every financial decision is a trade-off. When you buy something, you're not just paying the price — you're giving up everything else that money could have done.`,
        example: {
          problem: 'You earn $20/week. You spend $15 and save $5. How much will you have saved after 10 weeks?',
          steps: ['You save $5 per week', 'Over 10 weeks: 5 × 10 = $50', 'After 10 weeks you have $50 saved'],
          answer: '$50 saved',
        },
        practice: {
          problem: 'You earn $12 per week doing chores. You save one-quarter of it each week. How much will you save in 8 weeks?',
          hint: 'Find one-quarter of $12 first. Then multiply by 8 weeks.',
          answer: '24',
          acceptedAnswers: ['24', '$24', '24 dollars', '$24.00'],
        },
      },
      {
        title: 'Needs vs. Wants: The Foundation of Every Budget',
        teach: `Before you can manage money, you need to sort what you spend it on.

NEEDS: Things you cannot safely go without.
  — Food, water, shelter, clothing, healthcare, education.

WANTS: Things that make life better but aren't essential.
  — Games, eating out, new shoes when old ones still work, entertainment.

This sounds simple. The hard part: most of us tell ourselves wants are needs.

A budget is just a plan for where your money goes BEFORE you spend it. The most powerful budget rule:

  PAY YOURSELF FIRST.

Before you buy anything, move your savings aside. Then spend what's left. Most people do it backwards — spend first, save what's left — and find there's never anything left.

The three-bucket system: for every $10 you earn, put $3 in savings, $1 in giving (charity, gifts), and $6 in spending. This works at any income level.`,
        example: {
          problem: 'Marcus earns $25/week. He uses the 3-bucket system. How much goes in each bucket?',
          steps: ['Savings (30%): $25 × 0.30 = $7.50', 'Giving (10%): $25 × 0.10 = $2.50', 'Spending (60%): $25 × 0.60 = $15.00', 'Total: $7.50 + $2.50 + $15.00 = $25.00 ✓'],
          answer: 'Savings $7.50 · Giving $2.50 · Spending $15.00',
        },
        practice: {
          problem: 'Which category does "buying food" belong to: a need or a want?',
          hint: 'Can you safely live without it?',
          answer: 'need',
          acceptedAnswers: ['need', 'a need', 'needs'],
        },
      },
      {
        title: 'Entrepreneurship: How Businesses Are Born',
        teach: `A business doesn't start with money. It starts with seeing a PROBLEM and figuring out how to solve it in a way people will pay for.

The formula:
PROBLEM → SOLUTION → VALUE → BUSINESS

Examples:
— Travis Kalanick couldn't get a taxi in Paris in 2008. That was the seed of Uber.
— Sara Blakely cut the feet off her pantyhose to wear under white trousers. That was the seed of Spanx (a billion-dollar company).
— A 12-year-old sells cookies on Saturdays in a neighborhood where nobody offers fresh baked goods → small business.

THREE TYPES OF BUSINESS:
1. SERVICE: You sell your time and skill (lawn mowing, tutoring, design)
2. PRODUCT: You make or buy something and sell it for more than you paid (handmade jewelry, reselling sneakers)
3. DIGITAL: You create once and sell many times (app, course, ebook)

PROFIT = Revenue − Costs
Revenue: all money that comes IN
Costs: all money that goes OUT (materials, tools, advertising, your time)
If revenue > costs = profit. If costs > revenue = loss.

The most common mistake: forgetting to count your OWN TIME as a cost. If it takes 2 hours to make something you sell for $5, and you could earn $10/hour doing something else, you're actually losing money.`,
        example: {
          problem: 'Jus makes bracelets. Materials cost $2 each. She sells each for $8. She makes 5 per hour. How much does she earn per hour?',
          steps: [
            'Revenue per bracelet: $8',
            'Cost per bracelet: $2 (materials)',
            'Profit per bracelet: $8 - $2 = $6',
            '5 bracelets/hour × $6 = $30/hour profit',
          ],
          answer: '$30/hour — a solid business if she has customers.',
        },
        practice: {
          problem: 'A business earns $1,200 in sales but spends $900 on materials and $150 on advertising. What is the profit?',
          hint: 'Profit = Revenue minus ALL costs.',
          answer: '150',
          acceptedAnswers: ['150', '$150', '150 dollars'],
        },
      },
      {
        title: 'Banking: What Banks Actually Do With Your Money',
        teach: `When you put money in a bank, they don't put it in a vault. They LEND IT OUT to other people and charge interest — paying you a fraction of that interest as your "savings rate."

HOW BANKS MAKE MONEY:
— They pay you 0.5% interest on savings
— They lend your money to someone else at 7% (mortgage), 20% (credit card), or 400% (payday loan)
— The difference is their profit: called the NET INTEREST MARGIN

FRACTIONAL RESERVE BANKING:
Banks only keep a fraction of deposits on hand. They can lend out the rest. This means:
— A $1,000 deposit can support $10,000 in loans
— Banks create money through lending — every loan creates new money in the system

TYPES OF ACCOUNTS:
CHECKING: For spending. Lower interest. Easy access. Debit card connected.
SAVINGS: For storing. Higher interest. Some withdrawal limits.
CD (Certificate of Deposit): Lock money in for 6-60 months for higher interest.

FDIC INSURANCE (USA):
Your deposits are insured up to $250,000 by the federal government. If the bank fails, you get your money back. This is why bank runs are less common today.

TYPICAL RATES TO KNOW:
Savings: 0.5–5% | Credit card: 18–29% | Payday loan: 300–400% APR | Federal student loan: 5–8%`,
        example: {
          problem: 'A bank holds $100,000 in deposits and lends 90% out at 6% while paying depositors 1%. What is the bank\'s annual profit?',
          steps: [
            'Loans: $90,000 × 6% = $5,400 in interest income',
            'Paid to depositors: $100,000 × 1% = $1,000',
            'Net profit: $5,400 - $1,000 = $4,400',
          ],
          answer: '$4,400 — the bank earns 6% on your money and pays you back 1%.',
        },
        practice: {
          problem: 'What government agency insures US bank deposits up to $250,000 so you don\'t lose money if a bank fails?',
          hint: 'Four letters. Created after the Great Depression bank failures.',
          answer: 'fdic',
          acceptedAnswers: ['fdic', 'the fdic', 'federal deposit insurance corporation'],
        },
      },
    ],
    8: [
      {
        title: 'Compound Interest: The Most Powerful Force in Finance',
        teach: `Albert Einstein reportedly called compound interest "the eighth wonder of the world. He who understands it, earns it. He who doesn't, pays it."

SIMPLE INTEREST: you earn interest only on your original deposit.
  $1,000 at 10% per year = $100/year.
  After 10 years: $2,000.

COMPOUND INTEREST: you earn interest on your original deposit PLUS the interest you've already earned. Your interest earns interest.
  Year 1: $1,000 × 1.10 = $1,100
  Year 2: $1,100 × 1.10 = $1,210
  Year 3: $1,210 × 1.10 = $1,331
  ...
  After 10 years: $2,593.74 — not $2,000.

The RULE OF 72: Divide 72 by the annual interest rate to find how many years it takes to double.
  72 ÷ 10% = 7.2 years to double
  72 ÷ 6% = 12 years to double
  72 ÷ 4% = 18 years to double

The most important insight: time beats everything. $5,000 invested at age 15 grows more by age 65 than $50,000 invested at age 45. Starting early is the single most powerful financial move you can make.`,
        example: {
          problem: 'You put $500 in an account at 8% compound interest. How much after 3 years?',
          steps: [
            'Year 1: $500 × 1.08 = $540.00',
            'Year 2: $540 × 1.08 = $583.20',
            'Year 3: $583.20 × 1.08 = $629.86',
          ],
          answer: '$629.86 after 3 years',
        },
        practice: {
          problem: 'Using the Rule of 72, how many years does it take for money to double at 6% annual interest?',
          hint: 'Divide 72 by the interest rate.',
          answer: '12',
          acceptedAnswers: ['12', '12 years', '12 yrs'],
        },
      },
      {
        title: 'Assets, Liabilities, and Net Worth',
        teach: `Three words that determine every person's financial reality:

ASSET: Something you OWN that has value or generates income.
  — Cash, investments, a business, property, skills.

LIABILITY: Something you OWE — a debt, a loan, a financial obligation.
  — Credit card balance, student loan, car loan.

NET WORTH: What you're worth on paper.
  Net Worth = Total Assets − Total Liabilities

The goal isn't to earn a high income. The goal is to build assets that generate income — so that eventually your assets pay for your life, not your labor.

Robert Kiyosaki's key insight: the rich buy assets. The middle class buy liabilities thinking they're assets. Example: A car loses value and costs money every month (liability). A business or investment account gains value and produces income (asset).

The financial trap most people fall into: earning more but also spending more — their lifestyle inflates with their income. The discipline is keeping your expenses constant as your income grows and routing the difference into assets.`,
        example: {
          problem: 'Amara has: $2,000 in savings, a laptop worth $800, a student loan of $1,500. What is her net worth?',
          steps: [
            'Assets: $2,000 (savings) + $800 (laptop) = $2,800',
            'Liabilities: $1,500 (loan)',
            'Net Worth = $2,800 − $1,500 = $1,300',
          ],
          answer: 'Net worth = $1,300',
        },
        practice: {
          problem: 'What is the formula for net worth?',
          hint: 'It involves total assets and total liabilities.',
          answer: 'assets minus liabilities',
          acceptedAnswers: [
            'assets minus liabilities',
            'total assets minus total liabilities',
            'assets - liabilities',
            'net worth = assets - liabilities',
          ],
        },
      },
    ],
  },
  law: {
    5: [
      {
        title: 'Contracts Are Everywhere — and You Sign Them Every Day',
        teach: `A CONTRACT is a legally binding agreement between two or more parties. You don't need a lawyer present. You don't need special paper. You just need four things:

1. OFFER — "I will sell you this for $X"
2. ACCEPTANCE — "Yes, I agree to those terms"
3. CONSIDERATION — both sides exchange something of value (money, services, a promise)
4. CAPACITY — both parties are old enough and mentally able to agree

YOU SIGN CONTRACTS EVERY DAY without realizing it:
  — Clicking "I Agree" on an app installs a contract. You've agreed to their terms.
  — Buying something on Amazon is a contract.
  — A babysitting job is a contract (verbal, but still real).

THE MOST IMPORTANT THING NOBODY TELLS YOU:
Minors (under 18) can VOID most contracts — the adult cannot. This is the law protecting you. If you sign a car purchase agreement at 16, you can cancel it. The dealer cannot cancel it just because you're young — only YOU get that right. Exception: contracts for necessities like food or medical care.

READ BEFORE YOU SIGN. Every "I Agree" button you click has terms. Most include:
  — Auto-renewal (keeps charging you after the free trial)
  — Arbitration clauses (you give up your right to sue in court)
  — Data collection rights (they can sell your information)

The company read what they wrote. You should too.`,
        example: {
          problem: 'Marcus, 14, signs a one-year streaming subscription at $12/month. After 2 months he wants to cancel and get a refund. What are his rights?',
          steps: [
            'Marcus is a minor — contracts signed by minors are "voidable" by the minor',
            'He can void the contract and seek a refund for unused months',
            'The streaming company cannot hold him to the full year',
            'He should notify them in writing (creates a record)',
          ],
          answer: 'Marcus can void the contract and request a refund — he is a minor and has the right to cancel.',
        },
        practice: {
          problem: 'When you click "I Agree" on an app, what legal document have you just formed?',
          hint: 'It has an offer, an acceptance, and consideration (your data/money for the service).',
          answer: 'a contract',
          acceptedAnswers: ['a contract', 'contract', 'terms of service contract', 'binding agreement'],
        },
      },
      {
        title: 'Consumer Rights: Laws That Protect You When Companies Don\'t',
        teach: `Businesses have lawyers who write contracts in the company's favour. You need to know which laws protect you.

KEY CONSUMER PROTECTION LAWS:

TRUTH IN LENDING ACT (TILA):
  Lenders MUST show you the ANNUAL PERCENTAGE RATE (APR) — not just the interest rate.
  APR includes all fees. If a payday lender charges "$15 per $100," that's 390% APR.
  You also have a 3-day right of rescission on home loans — you can cancel within 3 business days of signing.

FAIR DEBT COLLECTION PRACTICES ACT (FDCPA):
  Debt collectors CANNOT call before 8am or after 9pm.
  They CANNOT threaten you, lie about amounts, or pretend to be government agencies.
  You can send a "cease and desist" letter and they must stop calling.

EQUAL CREDIT OPPORTUNITY ACT (ECOA):
  Lenders cannot deny credit based on race, gender, religion, or national origin.

THE CFPB (Consumer Financial Protection Bureau):
  A government agency created in 2010 specifically to protect you from financial companies.
  You can file complaints at consumerfinance.gov. Companies respond because they have to.

CHARGEBACK RIGHTS:
  If you paid by credit card and don't receive what you paid for, you can dispute with your card issuer. Under the Fair Credit Billing Act, the card company investigates and can reverse the charge.`,
        example: {
          problem: 'A debt collector calls Jus\'s family at 7am and says "Pay now or we\'ll have you arrested." Is this legal?',
          steps: [
            '7am is before 8am — calls before 8am violate FDCPA',
            'Threatening arrest for a debt is also illegal under FDCPA',
            'Debt collectors cannot have you arrested for not paying a civil debt',
            'This family can report the collector to the CFPB and sue for damages',
          ],
          answer: 'Illegal on two counts: wrong time and false threat of arrest. Report to CFPB.',
        },
        practice: {
          problem: 'What does APR stand for, and why does it matter more than the interest rate alone?',
          hint: 'The A stands for Annual. The P stands for Percentage. The R stands for Rate. And it includes ALL costs.',
          answer: 'annual percentage rate',
          acceptedAnswers: ['annual percentage rate', 'apr', 'annual percent rate', 'annual percentage rate because it includes all fees'],
        },
      },
    ],
    8: [
      {
        title: 'The Mortgage Trap: What You\'re Really Signing',
        teach: `A mortgage is not just a loan. It is a contract that gives the bank the right to take your house if you don't pay. Here is what most people don't understand until they're in one.

THE REAL COST OF A MORTGAGE:
  $300,000 home loan at 7% for 30 years:
  Monthly payment = $1,996
  Total paid over 30 years = $718,560
  Interest paid = $418,560 — more than the house cost.

WHY YOUR FIRST PAYMENTS ARE MOSTLY INTEREST:
  This is AMORTIZATION. On month 1 of a $300,000 mortgage at 7%:
  Interest portion: $1,750 (7% ÷ 12 months × $300,000)
  Principal portion: $246
  You are paying $1,750 in interest and $246 off the actual loan.
  It takes about 20 years before your payment is more principal than interest.

KEY TERMS IN EVERY MORTGAGE:
  APR — includes all fees (must be disclosed by law — Truth in Lending Act)
  PMI — Private Mortgage Insurance: if you put less than 20% down, you pay to insure the BANK against your default. Monthly cost: 0.5–1.5% of loan value.
  ACCELERATION CLAUSE — if you miss payments, the bank can demand the ENTIRE remaining balance at once.
  ESCROW — bank holds extra money for property taxes and insurance (they don't trust you to pay on time).

RIGHT OF RESCISSION (Truth in Lending Act):
  You have 3 BUSINESS DAYS after signing a home loan to cancel it, no penalty.
  This right exists. Most people don't know it. It saved many people who were tricked.

FORECLOSURE: if you stop paying, the bank forecloses — takes the house, sells it, keeps the proceeds. You lose equity, credit score, and home. This process takes months to years but is devastating.`,
        example: {
          problem: 'On a $200,000 mortgage at 6% for 30 years, month 1: how much of the $1,199 payment goes to interest vs. principal?',
          steps: [
            'Monthly interest = 6% ÷ 12 = 0.5% per month',
            '0.5% × $200,000 = $1,000 in interest',
            'Principal paid = $1,199 − $1,000 = $199',
            'Month 1: $1,000 to bank (interest), $199 off the loan',
          ],
          answer: '$1,000 to interest, $199 to principal. You barely dented the loan.',
        },
        practice: {
          problem: 'What is the name of the clause in a mortgage that allows the bank to demand the full remaining balance if you miss payments?',
          hint: 'It "accelerates" the repayment timeline.',
          answer: 'acceleration clause',
          acceptedAnswers: ['acceleration clause', 'the acceleration clause', 'due on sale clause', 'accelerator clause'],
        },
      },
      {
        title: 'Car Notes and Student Loans: The Traps in the Fine Print',
        teach: `These are the two contracts most young adults sign first. Both can chain you financially for years if you don't understand them.

CAR NOTE (AUTO LOAN):
  You buy a $32,000 car at 7% APR for 60 months (5 years).
  Monthly payment: $633/month.
  Total paid: $37,980.
  You paid $5,980 in interest — plus the car lost 40% of its value in 3 years (depreciation).

THE REAL TRAP: BEING UPSIDE DOWN.
  After 18 months, your car is worth $19,000. You still owe $24,000. You owe more than the car is worth. You cannot sell it without paying the difference out of pocket. This is called being "underwater" or "upside down" on a loan.

GAP INSURANCE: if your car is totalled, your regular insurance pays current value ($19,000). You still owe $24,000. GAP insurance covers the $5,000 gap. Without it, you owe $5,000 on a car you no longer have.

STUDENT LOANS:
  Two types: SUBSIDIZED (government pays interest while you're in school) and UNSUBSIDIZED (interest accrues from day one).
  CAPITALIZED INTEREST: unpaid interest gets added to your principal. A $20,000 loan at 6% with no payments for 4 years becomes ~$25,300 — and now you owe interest on $25,300.

INCOME-DRIVEN REPAYMENT (IDR): federal student loan option that caps payments at 5–10% of your discretionary income. Remaining balance forgiven after 20–25 years.

DEFAULT: miss payments for 270 days on federal student loans → default.
  Consequences: credit destroyed, wages garnished (government takes directly from paycheck), tax refunds seized, ineligible for more federal aid.
  There is no bankruptcy escape for student loans. This is by law (11 U.S.C. §523).

HOW TO PROTECT YOURSELF:
  1. Calculate the TOTAL COST before signing, not just the monthly payment.
  2. Read the Truth in Lending disclosure — it is legally required and tells you the full cost.
  3. Never borrow more than one year's expected starting salary for college.`,
        example: {
          problem: 'Sophia takes a $15,000 unsubsidized student loan at 6% but makes no payments during 4 years of college. What does she owe when she graduates?',
          steps: [
            'Interest accrues: 6% × $15,000 = $900/year',
            '4 years × $900 = $3,600 in unpaid interest',
            'Capitalized interest: $3,600 added to principal → new balance = $18,600',
            'Now she pays 6% interest on $18,600, not the original $15,000',
          ],
          answer: '$18,600 at graduation. The interest on interest makes it grow further from there.',
        },
        practice: {
          problem: 'When unpaid interest is added to the loan principal so you pay interest on interest, what is this process called?',
          hint: 'Think of the word "capital" — the interest becomes part of the capital.',
          answer: 'capitalization',
          acceptedAnswers: ['capitalization', 'capitalized interest', 'interest capitalization', 'capitalizing interest'],
        },
      },
      {
        title: 'The Stock Market: What You\'re Actually Buying',
        teach: `When you buy a stock, you buy a tiny OWNERSHIP STAKE in a company. If the company grows, your stake becomes more valuable. If it shrinks, so does yours.

HOW THE MARKET WORKS:
— Companies sell shares via an IPO (Initial Public Offering) to raise capital
— After that, shares trade between investors on exchanges (NYSE, NASDAQ)
— Stock prices are driven by: earnings, growth expectations, interest rates, and sentiment

KEY TERMS:
P/E RATIO (Price-to-Earnings): How much you pay per $1 of earnings. P/E of 20 means you pay $20 for $1/year of profit. Higher = market expects growth.
DIVIDEND: Some companies pay shareholders a portion of profits quarterly.
INDEX FUND: Buys a slice of every stock in an index (like the S&P 500 — 500 largest US companies). Automatically diversified.
DIVERSIFICATION: Spread across many companies — if one fails, you don't lose everything.

THE EVIDENCE ON STOCK PICKING:
90%+ of professional fund managers underperform the S&P 500 index over 10+ years after fees. The evidence strongly favors low-cost index funds for most investors.`,
        example: {
          problem: 'You invest $1,000 in a company with a P/E ratio of 50. The market average P/E is 20. What does this tell you?',
          steps: [
            'P/E of 50: you\'re paying $50 for every $1 of current earnings',
            'Market average is $20 per $1 of earnings — you\'re paying a big premium',
            'High P/E means investors expect the company to grow earnings significantly',
            'If growth doesn\'t materialize, the price can drop sharply',
          ],
          answer: 'The market expects high future growth. If growth disappoints, the stock can fall sharply.',
        },
        practice: {
          problem: 'What is the name for a fund that automatically buys a piece of every company in a market index like the S&P 500?',
          hint: 'Two words: "index" and a word for a collection of investments.',
          answer: 'index fund',
          acceptedAnswers: ['index fund', 'an index fund', 'index funds', 'etf', 'index etf'],
        },
      },
      {
        title: 'Taxes: The System You\'ll Live In',
        teach: `Taxes are not optional. Understanding the system determines how much of your earnings you actually keep.

PROGRESSIVE TAX (US system):
Higher earners pay a higher percentage. But brackets work in steps:
  — You pay 10% on the first $11,000
  — 12% on the next $33,000
  — 22% on the next chunk, etc.
Your MARGINAL rate is the rate on your last dollar. Your EFFECTIVE rate is the percentage of total income you actually pay — always lower than your marginal rate.

COMMON MISTAKE: "If I earn more I'll move to a higher bracket and pay more overall."
WRONG. You only pay the higher rate on income ABOVE the threshold. Earning more always leaves you with more after-tax income.

CAPITAL GAINS TAX:
  — Short-term (held < 1 year): taxed as ordinary income (up to 37%)
  — Long-term (held > 1 year): 0%, 15%, or 20%
  — Wealthy investors hold assets for years to pay 15-20% instead of 37%

W-2 vs. 1099:
  — W-2 (employee): taxes withheld automatically
  — 1099 (contractor): you pay ALL taxes yourself including 15.3% self-employment tax

DEDUCTIONS reduce taxable income. CREDITS reduce your actual tax bill. Credits are better.`,
        example: {
          problem: 'First $11,000 taxed at 10%. Next $33,000 at 12%. If you earn $30,000, what do you actually owe?',
          steps: [
            'First $11,000 × 10% = $1,100',
            'Remaining $19,000 × 12% = $2,280',
            'Total: $1,100 + $2,280 = $3,380',
            'Effective rate: $3,380 / $30,000 = 11.3% — not 12%',
          ],
          answer: '$3,380 total. Effective rate 11.3% because lower brackets apply first.',
        },
        practice: {
          problem: 'An investor holds a stock for 14 months and sells it for $10,000 profit. Is this short-term or long-term capital gains, and which is taxed at a lower rate?',
          hint: 'Key: did they hold it more or less than one year?',
          answer: 'long-term capital gain, taxed at a lower rate',
          acceptedAnswers: ['long-term', 'long term', 'long-term capital gain', 'long term capital gain', 'long-term, lower rate'],
        },
      },
    ],
  },
  health: {
    5: [
      {
        title: 'Your Electric Body — 7 Systems, All Connected',
        teach: `Your body is not just flesh and bone. Dr. Sebi (Alfredo Bowman), the Honduran-born healer, called it the "electric body" — and he was right. Your neurons fire electrical signals at 70 millivolts. Your heart generates 1.5 watts of electricity with every beat. You ARE electric.

Seven systems make everything work:

SKELETAL (206 bones): Your frame. Stores minerals (calcium, phosphorus). Protects organs. Red blood cells are MADE inside your bones.

MUSCULAR (600+ muscles): Movement, posture, pumping blood. Muscles only pull — they never push. That's why they work in pairs (bicep pulls, tricep extends).

CIRCULATORY: Your heart pumps 2,000 gallons of blood every day. Blood carries oxygen, nutrients, and removes waste. 60,000 miles of blood vessels in your body.

DIGESTIVE: Breaks food into nutrients your cells can use. Your gut has more neurons than your spinal cord — scientists call it the "second brain."

RESPIRATORY: Every breath pulls in oxygen, expels carbon dioxide. You take 20,000 breaths a day without thinking.

NERVOUS: Your brain and spinal cord. Processes everything you sense, feel, and think. Sends signals at 268 mph.

IMMUNE: Your army. White blood cells identify and destroy pathogens. What you eat determines how strong this army is.

ALL 7 SYSTEMS ARE CONNECTED. What you eat becomes your blood. Your blood feeds every cell in every system. Food is not just energy — it is INFORMATION that tells your body how to operate.`,
        example: {
          problem: 'If you eat only processed food with no real minerals for a year, which systems would suffer first?',
          steps: [
            'Digestive: first contact — cannot extract nutrients that aren\'t there',
            'Circulatory: blood becomes nutrient-deficient, carries less oxygen',
            'Immune: army weakens — white blood cells need minerals to function',
            'Skeletal: bones begin pulling their own calcium to compensate',
            'Everything degrades — all systems depend on the same blood supply',
          ],
          answer: 'All systems degrade, starting with immune and digestive. The body is one system, not seven separate ones.',
        },
        practice: {
          problem: 'Red blood cells are produced inside which system of the body?',
          hint: 'Think about what bones store and produce inside the marrow.',
          answer: 'skeletal',
          acceptedAnswers: ['skeletal', 'skeletal system', 'bones', 'the skeletal system', 'bone marrow'],
        },
      },
      {
        title: 'Food Is Information — The Alkaline Way',
        teach: `Every food you eat sends a message to your body. The question is: what message?

YOUR BODY'S pH:
Blood pH is 7.35–7.45 — slightly alkaline. Your body works extremely hard to keep it in this range. If it drops below 7.0 or above 7.8, you die. Your body FIGHTS to stay alkaline.

DR. SEBI'S INSIGHT:
Dr. Sebi taught that disease cannot thrive in a truly alkaline body. He built an "African Bio-Mineral Balance" approach: feed the body the electric, mineral-rich foods it was designed for.

ALKALINE FOODS (what he called "electric"):
  — Leafy greens: kale, collard greens, dandelion greens
  — Fruits: mango, banana, elderberries, soursop, sea grapes
  — Grains: spelt, kamut, teff, quinoa, wild rice, amaranth
  — Seeds: hemp seeds, sesame seeds
  — Sea vegetables: sea moss (contains 92 of the 102 minerals your body needs), bladderwrack
  — Natural sweetener: pure agave, date sugar
  — Oils: avocado oil, grape seed oil, hemp oil, coconut oil

WHAT HE CALLED "DEAD FOOD":
Processed, microwaved, preserved — food with no living enzymes, no real minerals. These foods require your body to use its own mineral reserves just to digest them. They take more than they give.

THE MUCUS THEORY:
Dr. Sebi taught that mucus is the root of all disease. Acidic, processed foods cause the body to produce excess mucus to protect itself. That mucus coats the intestinal walls, blocks absorption, clogs airways, and creates the conditions where disease can live.

What modern nutrition science agrees on: high-fiber, whole plant foods reduce inflammation, support the gut microbiome, and lower chronic disease risk. The minerals in sea vegetables (iodine, iron, zinc, bromide) are essential for thyroid and immune function. The exact pH claim is debated — but the food choices themselves are sound.`,
        example: {
          problem: 'Which option is more aligned with Dr. Sebi\'s electric food list: (A) brown rice, spinach, hemp seeds, or (B) white bread, processed cheese, and soda?',
          steps: [
            'A: Brown rice = whole grain, spinach = alkaline leafy green, hemp seeds = approved seed — all real, mineral-rich foods',
            'B: White bread = stripped hybrid grain, processed cheese = acidic, soda = acidic + high sugar — none on Dr. Sebi\'s list',
            'Option A: electric food. Option B: dead food.',
          ],
          answer: 'Option A — all three are whole, mineral-dense, alkaline-forming foods.',
        },
        practice: {
          problem: 'What is the natural pH range of healthy human blood?',
          hint: 'It is slightly alkaline — between 7.3 and 7.5.',
          answer: '7.35 to 7.45',
          acceptedAnswers: ['7.35 to 7.45', '7.35-7.45', '7.4', 'between 7.35 and 7.45', '7.35–7.45', 'slightly alkaline'],
        },
      },
      {
        title: 'Reading Nutrition Labels: The Hidden Information',
        teach: `Every packaged food has a nutrition facts label. It's a legal document — companies must tell the truth on it. But it's designed so most people don't understand it.

SERVING SIZE TRAP:
The entire label is based on ONE SERVING. A "single" bag of chips often contains 2.5 servings. Multiply everything by 2.5 to get what you actually ate.

WHAT TO LOOK FOR:
FIBER: Helps digestion, slows sugar absorption. Goal: 25-38g/day. Look for 3g+ per serving.

ADDED SUGAR vs NATURAL SUGAR: Natural sugar in fruit comes with fiber that slows absorption. Added sugar (in cereal, sauces, drinks) spikes blood sugar and causes energy crashes.
Daily limit: 25g for adults. Many children's cereals have 20g in ONE bowl.

SODIUM: High sodium raises blood pressure over time. Limit: under 2,300mg/day. One fast food meal can have 2,000mg.

INGREDIENT ORDER: Listed from MOST to LEAST by weight. If sugar is first or second, it's the main component.

DR. SEBI'S PRINCIPLE: Food is either building you or breaking you down. Alkaline, whole foods have more minerals, more fiber, less processing. The more processed, the less it resembles real food.`,
        example: {
          problem: 'A "healthy" granola bar shows: 8g sugar, 150 calories per serving. But the bag contains 3 servings. What are the real numbers for the whole bag?',
          steps: [
            '8g sugar × 3 servings = 24g sugar (a full day\'s limit)',
            '150 calories × 3 = 450 calories',
            'The "healthy" bar contains a day\'s worth of added sugar',
            'This is the serving size trap — always check how many servings you\'re actually eating',
          ],
          answer: '24g sugar, 450 calories for the whole bag. The serving size trap makes it look much healthier than it is.',
        },
        practice: {
          problem: 'On a food label, ingredients are listed from most to least by weight. If a cereal lists "sugar" as the second ingredient, what does this mean?',
          hint: 'Second ingredient = second largest component by weight.',
          answer: 'sugar is one of the main ingredients',
          acceptedAnswers: ['sugar is one of the main ingredients', 'mostly sugar', 'sugar is near the top', 'it is mostly sugar'],
        },
      },
      {
        title: 'Exercise Science: Why Your Body Changes When You Train',
        teach: `Exercise works through a simple principle: STRESS → RECOVERY → ADAPTATION.

1. You stress the body (a hard workout)
2. The body is briefly weaker (muscles have micro-tears)
3. During rest and sleep, the body repairs and overbuilds (SUPERCOMPENSATION)
4. You are now slightly stronger, faster, or fitter than before

Skip step 3 (rest) and you don't improve — you break down. This is overtraining.

TYPES OF TRAINING AND WHAT EACH BUILDS:
CARDIOVASCULAR: Running, cycling, swimming.
  — Builds heart efficiency (elite athletes have resting heart rate of 35-40 bpm vs. 60-80 normal)
  — Increases mitochondria density (more energy factories in each muscle cell)

STRENGTH: Resistance training. Builds muscle fiber size and neural efficiency.

PLYOMETRIC: Explosive movements (jumps, sprints). Builds fast-twitch muscle fibers — power.

ENERGY SYSTEMS:
ATP-PCr (0–10 sec): Sprinting, jumping — immediate explosive energy
Glycolytic (10 sec–2 min): 400m run, basketball — fast energy from glucose
Aerobic (2+ min): Marathon, cycling — slow but sustainable

A tennis player or soccer player needs all three energy systems.`,
        example: {
          problem: 'An athlete runs a 10km race Monday and does a heavy leg workout Wednesday. Thursday her legs feel worse than Monday. Why?',
          steps: [
            'Monday race stressed cardiovascular and leg muscles',
            'Recovery requires 48+ hours after hard efforts',
            'Wednesday workout added more stress before recovery completed',
            'Thursday: still in the fatigue phase before supercompensation — the adaptation hasn\'t happened yet',
          ],
          answer: 'Insufficient recovery. The body needs 48+ hours to repair and adapt. Training on tired muscles extends breakdown without triggering growth.',
        },
        practice: {
          problem: 'After a hard workout, when does the body actually become stronger — during the workout or during the rest period after?',
          hint: 'The workout creates the stress. The _____ is when adaptation happens.',
          answer: 'rest',
          acceptedAnswers: ['rest', 'recovery', 'rest and recovery', 'during rest', 'during sleep', 'after the workout'],
        },
      },
    ],
    8: [
      {
        title: 'Sports Science: How You Actually Get Stronger',
        teach: `Getting stronger is not magic. It is a biological process. Understanding it means you can train smarter than anyone who just "works hard."

HOW MUSCLE GROWTH WORKS (HYPERTROPHY):
1. You apply stress (heavy resistance or intense effort)
2. Muscle fibers develop microscopic tears
3. Satellite cells rush in and repair the damage
4. They rebuild the fibers THICKER — more cross-bridge proteins (actin and myosin)
5. You are now stronger than before

This is called SUPERCOMPENSATION. Your body doesn't just repair damage — it overcompensates so the same stress is easier next time.

THE ATP ENERGY SYSTEMS (what fuels your muscles):
  ATP-PC SYSTEM (0–10 seconds): Explosive power. 100m sprint, vertical jump, max weightlift. Creatine phosphate powers this. No oxygen needed.
  ANAEROBIC GLYCOLYSIS (10 sec – 2 min): 400m run, fast basketball. Glucose without oxygen. Produces lactic acid (the burn).
  AEROBIC SYSTEM (2+ min): Long runs, cycling, swimming. Oxygen + glucose/fat. Sustainable. Built through consistent cardio training.

PROGRESSIVE OVERLOAD — the single most important training law:
  To keep getting stronger, you must progressively increase the demand. If you always lift the same weight, you plateau. Add weight, reps, sets, or reduce rest time — force the body to adapt.

RECOVERY IS WHERE YOU GROW (not during training):
  Training breaks down muscle. Sleep and rest is where it rebuilds.
  90% of growth hormone is released during deep sleep.
  Under 6 hours of sleep = CATABOLISM — your body breaks muscle down for energy.
  Goal: 8–10 hours for athletes. Non-negotiable.

NUTRITION TIMING:
  PROTEIN: 0.7–1g per pound of bodyweight daily. Within 2 hours of training.
  CARBS: replenish glycogen before training (fuel for the anaerobic systems).
  HYDRATION: even 2% dehydration reduces strength output by 10%.`,
        example: {
          problem: 'Uni trains hard every day for 2 weeks, sleeping 5 hours a night, and gets WEAKER. Why?',
          steps: [
            'Training creates damage — muscle fibers are torn down',
            'Under 6 hours sleep = insufficient growth hormone release',
            'Without proper repair, the damage accumulates — called overtraining',
            'With no recovery window, supercompensation never happens',
            'The body breaks down muscle (catabolism) to fuel activity instead',
          ],
          answer: 'Insufficient sleep prevents repair. Training tears down; sleep rebuilds. No sleep = no growth, only damage.',
        },
        practice: {
          problem: 'What is the term for the process where the body repairs muscle fibers bigger and stronger after training stress?',
          hint: 'It starts with "super" — the body over-repairs to handle the same stress more easily next time.',
          answer: 'supercompensation',
          acceptedAnswers: ['supercompensation', 'super compensation', 'hypertrophy', 'muscle hypertrophy', 'muscle adaptation'],
        },
      },
      {
        title: "Dr. Sebi's Blueprint — The Science of Eating for Your Body",
        teach: `Dr. Sebi spent decades studying traditional African, South American, and indigenous healing. His model: the human body is an electric organism, and disease is the disruption of that electricity through toxins, acidic foods, and mineral deficiency.

THE AFRICAN BIO-MINERAL BALANCE:
Dr. Sebi believed people of African descent are specifically adapted to mineral-rich, alkaline, plant-based diets — foods that existed before colonialism changed what we ate. He pointed to chronic disease rates in communities that moved away from traditional whole-food diets as evidence.

DR. SEBI'S FOUR FOOD CATEGORIES:
  LIVE: Raw fruits and vegetables. Maximum enzyme content. The body barely has to work.
  RAW: Unprocessed whole foods. Minimal cooking.
  COOKED: Lightly cooked vegetables, grains. Some enzymes lost but minerals remain.
  DEAD: Processed, microwaved, preserved. No enzymes, stripped minerals, chemical additives.

KEY APPROVED FOODS (from his published nutritional guide):
  GRAINS: Spelt, kamut, teff, quinoa, wild rice, amaranth, fonio
  VEGETABLES: Kale, collard greens, watercress, dandelion greens, bell peppers, mushrooms
  FRUITS: Mango, banana, elderberries, soursop, sea grapes, berries, apples, pears
  NUTS/SEEDS: Brazil nuts, hemp seeds, walnuts, sesame seeds
  SEA PLANTS: Sea moss (92 minerals), bladderwrack, nori
  HERBS: Burdock root, elderberry, sarsaparilla, soursop leaves

THE SCIENCE THAT ALIGNS:
  • Anti-inflammatory diet studies show plant-based, whole-food diets reduce heart disease, diabetes, and cancer risk significantly (Harvard, Oxford, WHO)
  • Sea moss: iron, iodine, zinc, calcium, magnesium, B vitamins — legitimate nutritional density
  • Gut microbiome research: high-fiber prebiotic foods (exactly what Dr. Sebi approved) feed beneficial bacteria → better immunity, mood, and cognition
  • Polyphenols in dark leafy greens protect mitochondria — the energy factories of cells

WHAT SCIENCE DEBATES:
  The specific "blood pH changes based on food" claim — blood pH is tightly regulated by the lungs and kidneys regardless of what you eat. But the FOOD CHOICES Dr. Sebi recommends are well-supported by mainstream nutrition science independently.

THE BOTTOM LINE:
You don't need to agree with every claim to benefit from the diet. Eat real food. Eat plants. Cut processed. Increase minerals. That part has overwhelming evidence.`,
        example: {
          problem: 'Evaluate: "Dr. Sebi says eating meat lowers blood pH and causes disease. My blood pH never changes, so his whole theory is wrong." Is this a good counter-argument?',
          steps: [
            'TRUE: Blood pH does not significantly change based on diet — the body regulates it tightly',
            'But the conclusion is a straw man — rejecting one mechanism does not disprove the whole dietary recommendation',
            'The foods Dr. Sebi recommends (plants, sea veg, whole grains) ARE independently supported by nutrition science',
            'The argument throws away a good diet because one mechanistic claim is overstated',
          ],
          answer: 'Partly right (on pH), but the conclusion is a logical error — rejecting one mechanism doesn\'t invalidate the entire dietary framework.',
        },
        practice: {
          problem: 'What does sea moss contain that makes it one of the most mineral-dense foods on Dr. Sebi\'s approved list?',
          hint: 'It is said to contain 92 of the 102 minerals the human body needs.',
          answer: '92 minerals',
          acceptedAnswers: ['92 minerals', '92 of 102 minerals', 'minerals', 'ninety-two minerals', '92 of the 102 minerals the body needs'],
        },
      },
      {
        title: 'Hormones and the Teenage Body: What\'s Actually Happening',
        teach: `Hormones are chemical messengers that travel through the bloodstream and tell organs what to do. During adolescence, the hormonal changes are among the most significant your body will experience.

KEY HORMONES:
TESTOSTERONE (both sexes, different amounts):
— Drives muscle growth, bone density, competitive drive
— Increases 10-30x in males during puberty
— Builds fast-twitch muscle fibers (explains the strength surge in teenage boys)

ESTROGEN (primarily females):
— Drives bone density (peaks at ~25), body fat distribution, reproductive development
— Affects mood via serotonin regulation

GROWTH HORMONE:
— Secreted during DEEP SLEEP — teenagers need 9 hours, not 7
— Cut sleep → cut growth hormone → cut muscle development and height potential

CORTISOL (stress hormone):
— Short bursts: useful for emergency response
— Chronic high cortisol: breaks down muscle (catabolic), deposits abdominal fat, impairs memory
— Chronic stress = chronically elevated cortisol = physically damaging

INSULIN:
— Released when blood sugar rises; tells cells to take in glucose
— Chronic sugar overconsumption → cells become insulin-resistant → risk of type 2 diabetes
— Dietary patterns set in adolescence affect insulin sensitivity for decades

THE DR. SEBI LENS: Most processed foods trigger large insulin spikes and inflammatory responses. Whole alkaline foods produce gentler metabolic responses supporting hormonal balance.`,
        example: {
          problem: 'An athlete sleeps 5 hours instead of 9 the night before training. What physiological consequences are they dealing with?',
          steps: [
            'Growth hormone is primarily secreted in deep sleep — 5 hours cuts deep sleep by >50%',
            'Less growth hormone → less protein synthesis → muscles repair more slowly',
            'Sleep deprivation raises cortisol → catabolic (breaks down muscle)',
            'Reduced cognitive performance → slower reaction time, worse decision-making',
          ],
          answer: 'Reduced growth hormone (less recovery), elevated cortisol (muscle breakdown), impaired cognition. Sleep is not optional for athletes.',
        },
        practice: {
          problem: 'What hormone is primarily secreted during deep sleep and is critical for muscle growth and recovery in athletes?',
          hint: 'Two words. It literally promotes growth.',
          answer: 'growth hormone',
          acceptedAnswers: ['growth hormone', 'hgh', 'human growth hormone', 'gh'],
        },
      },
      {
        title: 'Sports Nutrition: What Elite Athletes Actually Eat',
        teach: `Nutrition for sport is not about eating less. It is about fueling performance and optimizing recovery.

MACRONUTRIENTS AND SPORT:
CARBOHYDRATES: Primary fuel for exercise above 60% max heart rate (most sports).
  — Stored as glycogen in liver and muscles (~500g max)
  — Depleted glycogen = "hitting the wall" — performance collapse
  — Load carbs 2-3 days before a long event (carbohydrate loading)

PROTEIN: Building material, not primarily fuel.
  — Athletes need 1.6-2.2g per kg of bodyweight per day (2x the standard recommendation)
  — Timing matters: 20-40g within 30 minutes post-exercise starts repair faster

FAT: Essential for hormone production and fat-soluble vitamins (A, D, E, K).
  — Never eliminate fat. Very low-fat diets impair testosterone and estrogen production.

HYDRATION:
  — 2% drop in bodyweight through sweat → performance drops 5-8%
  — Thirst is a LAGGING indicator — you're already slightly dehydrated when you feel thirsty
  — Pre-hydrate, don't just react to thirst

MINERAL-RICH FOODS FOR ATHLETES:
Dark leafy greens, avocado, quinoa, sea moss — minerals are critical for muscle contraction, nerve firing, and oxygen transport. This is where Dr. Sebi's framework aligns directly with sports science: processed foods deplete mineral stores that athletes specifically need.`,
        example: {
          problem: 'A football player has a match in 3 days. What nutrition strategy optimizes their performance?',
          steps: [
            '3 days out: begin carbohydrate loading — increase complex carbs to max glycogen stores',
            '2 days out: maintain high carbs, reduce training intensity (preserve the glycogen)',
            '1 day out: high carbs, rest or light training, ensure full hydration',
            'Match day: meal 3-4 hours before (carbs + protein, low fat for easy digestion); water in the hours before',
          ],
          answer: 'Carbohydrate loading over 3 days, progressive hydration, pre-match meal 3-4 hours before.',
        },
        practice: {
          problem: 'Why is protein not primarily used as fuel during exercise, and what is its main role for athletes?',
          hint: 'Think about what happens to muscles after training — they need to be ___.',
          answer: 'to repair and build muscle',
          acceptedAnswers: ['to repair and build muscle', 'muscle repair', 'building muscle', 'it builds muscle', 'repair', 'building material'],
        },
      },
    ],
  },
  ai: {
    5: [
      {
        title: 'What AI Actually Is',
        teach: `AI (Artificial Intelligence) is not magic and it's not really "thinking." It's pattern matching on a very large scale.

Here's how it works:
An AI was trained by reading billions of pages of text. It learned: "when I see these words in this order, these kinds of words usually come next." That's it. It predicts the next word, over and over, to form a response.

This means:
- AI can be confidently WRONG. It doesn't "know" things — it predicts patterns.
- AI is very good at things that have lots of examples in its training data.
- AI cannot verify its own answers. You have to do that.

A good prompt tells the AI exactly what you need and what you already know.`,
        example: {
          problem: 'Bad prompt vs. good prompt: "Write about dogs" vs. "Write 3 sentences explaining why dogs make good pets for children, using simple language for a 5th grader."',
          steps: ['Bad prompt is vague — the AI guesses what you want', 'Good prompt says: length (3 sentences), topic (dogs as pets), audience (children), and register (simple)', 'The more specific, the more useful the output'],
          answer: 'A good prompt specifies length, format, topic, audience, and purpose.',
        },
        practice: {
          problem: 'If an AI gives you a fact that sounds confident but you\'re not sure is true, what should you do?',
          hint: 'AI can be wrong even when it sounds sure. What\'s the only way to know?',
          answer: 'verify it',
          acceptedAnswers: ['verify it', 'check it', 'look it up', 'verify', 'fact check', 'fact-check', 'research it', 'check another source'],
        },
      },
      {
        title: 'Machine Learning: Teaching Computers with Examples',
        teach: `Machine learning is how AI gets "smart." Instead of a programmer writing rules like "if a photo has these pixels, it's a cat," a machine learning system looks at thousands of cat photos and figures out the patterns itself.

Three types of ML:

SUPERVISED LEARNING: You show the computer examples WITH labels.
  — 10,000 photos labeled "cat" or "not cat"
  — The computer finds patterns that predict the label
  — This is how spam filters work, how Netflix recommends shows, how doctors use AI to detect tumours

UNSUPERVISED LEARNING: No labels. The computer finds patterns on its own.
  — Spotify clusters millions of songs by sound similarity — it doesn't know genres, it discovers groups
  — Used in customer segmentation, fraud detection

REINFORCEMENT LEARNING: The computer learns by trial and error, getting rewards for good actions.
  — AlphaGo learned to beat the world chess and Go champions this way
  — Self-driving cars and robots use this

The key insight: these systems don't "understand" — they find statistical patterns. They can be fooled by data they've never seen, by intentional manipulation, or when the world changes in ways their training didn't cover.`,
        example: {
          problem: 'An AI spam filter was trained on emails from 2020. In 2024, scammers change their tactics. What happens to the AI, and what does this tell us about machine learning?',
          steps: [
            'The AI learned patterns from 2020 spam — those patterns are "frozen" in the model',
            'New tactics don\'t match the old patterns → spam gets through',
            'The model needs to be retrained on new examples',
            'This is why all ML systems need continuous updating — the world changes but the model doesn\'t automatically adapt',
          ],
          answer: 'The AI fails on new patterns it was never trained on. ML models require regular retraining as the world changes.',
        },
        practice: {
          problem: 'What type of machine learning would you use to train a spam detector if you already have 50,000 labeled examples of "spam" and "not spam"?',
          hint: 'You have examples WITH labels telling the system the right answer.',
          answer: 'supervised learning',
          acceptedAnswers: ['supervised learning', 'supervised', 'supervised ml'],
        },
      },
      {
        title: 'AI Bias: When the Training Data Is Wrong',
        teach: `AI systems learn from data. If the data has bias — the AI will too. And because AI sounds confident and scientific, the bias is harder to see.

REAL EXAMPLES:
— Amazon built an AI hiring tool trained on 10 years of resumes. 10 years of resumes were mostly men (tech was male-dominated). The AI learned to prefer male candidates and penalized resumes containing the word "women's." Amazon scrapped it in 2018.
— Facial recognition software trained mostly on light-skinned faces has error rates of 0.8% on white men — but up to 34.7% on dark-skinned women (MIT research, 2018).
— A medical risk algorithm used "money spent on healthcare" as a proxy for "health need." Black patients had less money spent on them (historical discrimination) → the AI systematically underestimated their health needs.

HOW BIAS ENTERS:
1. Historical data contains historical discrimination — AI learns and continues it
2. Who collects the data (whose photos, whose language, whose world?)
3. What gets measured vs. what actually matters

THE HARD TRUTH: AI doesn't have morality. It optimizes for what you measure. You have to design for fairness explicitly — it won't happen by accident.`,
        example: {
          problem: 'A company uses AI to screen job applicants, trained on 10 years of their own hiring data. The company previously hired almost no women for technical roles. What is the likely outcome and why?',
          steps: [
            'The AI learns from past hiring decisions: "these applicants were hired"',
            'Past hiring was biased toward men → the AI learns to prefer male-associated signals',
            'Future applications from women get lower scores — even when equally qualified',
            'The historical bias is now automated and happens at scale, invisibly',
          ],
          answer: 'The AI perpetuates gender bias from the historical data, systematically scoring women lower.',
        },
        practice: {
          problem: 'When an AI system is trained on biased historical data and makes decisions that reflect that bias, what is this called?',
          hint: 'The prejudice from the past data gets learned and "locked in" to the system.',
          answer: 'ai bias',
          acceptedAnswers: ['ai bias', 'algorithmic bias', 'bias', 'data bias', 'trained bias'],
        },
      },
      {
        title: 'Prompt Engineering: Getting AI to Actually Help You',
        teach: `AI is a tool. Like any tool, using it well requires skill. The skill is called PROMPT ENGINEERING — writing instructions that get the AI to do exactly what you need.

THE SIX THINGS A GOOD PROMPT INCLUDES:

1. ROLE — tell the AI what expert to be: "Act as a high school chemistry teacher..."
2. CONTEXT — what does the AI need to know? "I am writing an essay arguing that..."
3. TASK — exactly what you want done: "Write," "Explain," "Critique," "Summarize"
4. FORMAT — how should the answer look? "In a bulleted list," "As a table comparing..."
5. CONSTRAINTS — what to avoid: "Use no jargon," "Keep it under 200 words"
6. EXAMPLES — what a good result looks like

The difference between a beginner and an expert is not which AI they use. It's how well they communicate with it.

CHAIN OF THOUGHT: For complex problems, add "Think step by step." This forces the AI to show its reasoning — which makes mistakes visible and easier to catch.`,
        example: {
          problem: 'Compare: Prompt A: "Help me with my essay." vs Prompt B: "I am a Grade 8 student writing a persuasive essay arguing that social media should be regulated. Rewrite my conclusion in 2 paragraphs with a call to action, without introducing any new arguments." Which is better and why?',
          steps: [
            'Prompt A gives the AI nothing to work with — it will produce something generic',
            'Prompt B specifies: grade level, topic, task (rewrite conclusion), format (2 paragraphs), technique (call to action), constraint (no new arguments)',
            'The AI can produce something specific and useful from Prompt B',
          ],
          answer: 'Prompt B — it specifies context, task, format, and constraints. The more specific the instruction, the more useful the output.',
        },
        practice: {
          problem: 'What phrase can you add to a prompt to make an AI show its reasoning step by step, making it easier to spot mistakes?',
          hint: 'It\'s a four-word instruction about how to think.',
          answer: 'think step by step',
          acceptedAnswers: ['think step by step', 'chain of thought', 'step by step', 'show your reasoning'],
        },
      },
    ],
    8: [
      {
        title: 'How LLMs Work — and Why They Hallucinate',
        teach: `A Large Language Model (LLM) like Claude or GPT is trained to predict the next token (roughly: word) in a sequence, based on patterns in its training data.

Three important things to understand:

1. LLMs don't look things up. They generate from memory — memory that was built during training and is now frozen. They have no access to current information unless given tools.

2. LLMs hallucinate. When asked about something rare or at the edge of their training data, they generate a plausible-sounding answer that may be false. They cannot tell the difference between what they know and what they're confabulating.

3. Prompt engineering changes the output significantly. A prompt is a set of instructions. The quality of your instructions determines the quality of the output — just like with a human intern.`,
        example: {
          problem: 'You ask an AI for 5 real academic papers on a topic. It gives you 5 titles, authors, and journal names. What should you do before citing them?',
          steps: ['LLMs hallucinate citations — they sound real but may be entirely invented', 'Search for each paper in Google Scholar, PubMed, or the journal\'s website', 'If you can\'t find it, it may not exist'],
          answer: 'Verify each citation in a real database before using it. Never trust AI citations directly.',
        },
        practice: {
          problem: 'What is the term for when an AI generates false information that sounds confident and plausible?',
          hint: 'It starts with "hall-" — like seeing something that isn\'t there.',
          answer: 'hallucination',
          acceptedAnswers: ['hallucination', 'hallucinating', 'ai hallucination', 'hallucinate'],
        },
      },
      {
        title: 'Neural Networks: How the Machine Actually Thinks',
        teach: `A neural network is a mathematical system loosely inspired by the brain. It doesn't work like the brain — but the analogy helps.

STRUCTURE:
- INPUT LAYER: receives data (pixels of an image, words in a sentence)
- HIDDEN LAYERS: millions of mathematical transformations (weights × inputs + biases)
- OUTPUT LAYER: produces a prediction (this is a cat / this word comes next)

HOW TRAINING WORKS:
1. Feed an input, get an output
2. Calculate how wrong (the "loss function")
3. Backpropagate — work backward through the network, adjusting weights to reduce the error
4. Repeat millions of times

After enough iterations, the weights encode patterns that generalize to new inputs.

TRANSFORMERS (the architecture behind ChatGPT, Claude, Gemini):
Add "attention mechanisms" — the model learns to pay different amounts of attention to different parts of the input. "The bank by the river" vs "the bank I deposit money in" — attention figures out which "bank" is meant from context.

THE KEY: these are not intelligent. They are extremely sophisticated curve-fitters — mathematical functions that map inputs to outputs based on training data. Remarkable. Not magic.`,
        example: {
          problem: 'A neural network trained to detect cancer in X-rays gets 97% accuracy on the test set but performs worse in a real hospital. What might explain this?',
          steps: [
            'Training and test data came from one hospital with one scanner type',
            'Different scanner brands produce slightly different images — the network learned scanner-specific artifacts, not cancer features',
            'This is "distribution shift" — real-world data differs from training data',
            'Fix: train on diverse data from many sources and test on data matching real deployment',
          ],
          answer: 'Distribution shift — the model learned features specific to training data, not generalizable cancer features.',
        },
        practice: {
          problem: 'In neural network training, what is the process called where error is propagated backward through the network to adjust weights and reduce mistakes?',
          hint: 'The error "propagates backward" through the layers.',
          answer: 'backpropagation',
          acceptedAnswers: ['backpropagation', 'backprop', 'back propagation', 'back-propagation'],
        },
      },
      {
        title: 'The Business of AI: Who Builds It and Why',
        teach: `AI is not neutral technology. It is built by companies with commercial interests. Understanding who builds AI and why tells you whose interests it serves.

THE MAJOR PLAYERS:
— OpenAI (GPT/ChatGPT): started as nonprofit, now majority-controlled by Microsoft ($13B invested). Revenue: subscriptions + API fees.
— Google (Gemini): has the data moat (Gmail, Search, YouTube). Every search query trains the model.
— Anthropic (Claude): founded by ex-OpenAI researchers. Amazon invested $4B. Positions as "AI safety" focused.
— Meta (Llama): gives away model weights free. Strategy: commoditize AI market so competitors can't charge, while Meta's moat is the social graph.

WHY THIS MATTERS:
— These models reflect their training data and choices of who curated it
— Commercial models optimize for engagement and revenue — not necessarily truth
— The "free" AI tools you use are paid for by your data and behavior
— Open source models can be inspected; closed models cannot

THE REGULATION QUESTION:
EU AI Act (2024) classifies AI systems by risk level — high-risk uses (hiring, credit, medical) require transparency and human oversight. The US has executive orders but no comprehensive law yet.`,
        example: {
          problem: 'A company deploys an "objective AI" hiring tool. Investigation reveals it was trained on resume data where 85% of hires were from 5 elite universities. What is the risk?',
          steps: [
            'The model learned to prefer signals from those 5 universities',
            'Candidates from other schools are systematically underscored regardless of ability',
            'EU AI Act: hiring tools are high-risk → must be audited for bias with human oversight',
            'US: Equal Employment Opportunity laws may apply if protected groups are affected',
          ],
          answer: 'Systemic bias against non-elite school graduates. EU AI Act requires auditing high-risk AI; EEOC laws may apply.',
        },
        practice: {
          problem: 'What is the name of the EU regulation passed in 2024 that classifies AI by risk level and requires human oversight for high-risk applications like hiring and credit decisions?',
          hint: 'Two words followed by "Act."',
          answer: 'eu ai act',
          acceptedAnswers: ['eu ai act', 'the eu ai act', 'european ai act', 'ai act', 'artificial intelligence act'],
        },
      },
      {
        title: 'Building with AI: APIs and What\'s Actually Possible',
        teach: `You don't have to wait for a company to build what you need. You can use AI APIs to build your own tools.

HOW AN AI API WORKS:
You send text (a "prompt") to a URL over HTTPS. The model processes it and sends back text (a "completion"). That's it. The complexity is in what you build around it.

WHAT YOU CAN BUILD:
— A study assistant that quizzes you on your own notes
— A code explainer that takes code and explains every line
— An essay reviewer that gives a grade and specific feedback
— A homework helper that walks through problems step by step (not just gives answers)

KEY CONCEPTS:
SYSTEM PROMPT: secret instructions you give the AI before the user talks to it. "You are a tutor. You never give direct answers — only hints."
CONTEXT WINDOW: how much text the model can "see" at once. Larger = more expensive.
TEMPERATURE: how creative/random the response is. 0 = very predictable, 1 = very varied. Use low temperature for facts, higher for creative writing.

MODELS (as of 2025):
— Claude Sonnet / Opus (Anthropic) — reasoning, safety
— GPT-4o (OpenAI) — general purpose
— Gemini (Google) — multimodal, long context
— Llama 3 (Meta) — open source, can run locally`,
        example: {
          problem: 'You want to build a study tool where users paste their notes and the AI generates quiz questions. What three components do you need?',
          steps: [
            '1. A system prompt: "You are a quiz generator. Given study notes, create 5 multiple choice questions testing key concepts."',
            '2. A user input: a text box where users paste their notes',
            '3. An API call combining system prompt + user notes → returns questions',
          ],
          answer: 'System prompt defining quiz behavior + user input for notes + API call to the LLM.',
        },
        practice: {
          problem: 'In an AI API, what is the name for the hidden instructions included before the user\'s message that shape how the AI behaves — like "You are a tutor, never give direct answers"?',
          hint: 'Two words: it sets up the "system" of behavior.',
          answer: 'system prompt',
          acceptedAnswers: ['system prompt', 'the system prompt', 'system message'],
        },
      },
    ],
  },
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const TOTAL_SECONDS = 20 * 60 // 20 minutes

export default function BasicsPage() {
  const params = useParams()
  const router = useRouter()
  const childId = params.childId as string
  const subject = params.subject as string
  const child = CHILD_INFO[childId] || { name: 'Student', grade: 5 }

  const grade = child.grade <= 5 ? 5 : 8
  const lessons = LESSONS[subject]?.[grade] || LESSONS[subject]?.[5] || []

  const [phase, setPhase] = useState<'teach' | 'example' | 'practice' | 'done'>('teach')
  const [lessonIdx, setLessonIdx] = useState(0)
  const lesson = lessons[lessonIdx] || lessons[0]
  const [answer, setAnswer] = useState('')
  const [answered, setAnswered] = useState<'correct' | 'wrong' | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [timerDone, setTimerDone] = useState(false)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [showScratchpad, setShowScratchpad] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastRef = useRef<{x: number; y: number} | null>(null)
  const [wordProblem, setWordProblem] = useState<{question: string; steps: {hint: string; solution: string}[]; answer: string} | null>(null)
  const [showWordProblem, setShowWordProblem] = useState(false)
  const [showWPAnswer, setShowWPAnswer] = useState(false)
  const [marsPhotos, setMarsPhotos] = useState<{url: string; camera: string; sol: number; date: string}[]>([])
  const [showMars, setShowMars] = useState(false)

  // ── Dynamic OpenStax curriculum ──────────────────────────────
  const [toc, setToc] = useState<Toc | null>(null)
  const [tocLoading, setTocLoading] = useState(true)
  const [chapIdx, setChapIdx] = useState(0)
  const [modIdx, setModIdx] = useState(0)
  const [moduleContent, setModuleContent] = useState<ModuleContent | null>(null)
  const [modLoading, setModLoading] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const [readDone, setReadDone] = useState(false)
  const [exampleDone, setExampleDone] = useState(false)
  const [practiceDone, setPracticeDone] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string>('')

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  async function speakText(text: string) {
    if (ttsLoading) return
    if (ttsPlaying && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setTtsPlaying(false)
      return
    }
    setTtsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/tts/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 4000) }),
      })
      if (!res.ok) return
      const data = await res.json()
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`)
      audioRef.current = audio
      audio.onended = () => { setTtsPlaying(false); audioRef.current = null }
      audio.play()
      setTtsPlaying(true)
    } catch (e) {
      console.error('TTS failed:', e)
    } finally {
      setTtsLoading(false)
    }
  }

  // Fetch daily word problem for math
  useEffect(() => {
    if (subject !== 'math') return
    fetch(`${API_URL}/api/curriculum/word-problem?grade=${grade}`)
      .then(r => r.json())
      .then(d => { if (d.question) setWordProblem(d) })
      .catch(() => {})
  }, [subject, grade])

  // Fetch Mars photos for science
  useEffect(() => {
    if (subject !== 'science') return
    fetch(`${API_URL}/api/curriculum/nasa-mars`)
      .then(r => r.json())
      .then(d => { if (d.photos?.length) setMarsPhotos(d.photos.slice(0, 4)) })
      .catch(() => {})
  }, [subject])

  // Fetch OpenStax table of contents for this subject
  useEffect(() => {
    const bookKey = SUBJECT_BOOKS[subject]?.primary
    if (!bookKey) { setTocLoading(false); return }
    setTocLoading(true)
    setToc(null)
    fetch(`${API_URL}/api/curriculum/toc/${bookKey}`)
      .then(r => r.json())
      .then((data: Toc) => {
        if (!data.chapters) return
        setToc(data)
        const startChap = GRADE_CHAPTER_START[bookKey]?.[grade] ?? 0
        const safeChap = Math.min(startChap, data.chapters.length - 1)
        setChapIdx(safeChap)
        setModIdx(0)
      })
      .catch(() => setToc(null))
      .finally(() => setTocLoading(false))
  }, [subject, childId])

  // Load module content whenever chapter/module index changes
  useEffect(() => {
    if (!toc) return
    const chapter = toc.chapters[chapIdx]
    if (!chapter) return
    const mod = chapter.modules[modIdx]
    if (!mod) return
    setModLoading(true)
    const bookKey = SUBJECT_BOOKS[subject]?.primary || ''
    fetch(`${API_URL}/api/curriculum/openstax/${bookKey}/${mod.id}`)
      .then(r => r.json())
      .then((data: ModuleContent) => setModuleContent(data))
      .catch(() => setModuleContent(null))
      .finally(() => setModLoading(false))
  }, [toc, chapIdx, modIdx, subject])

  // Canvas scratch pad — draw on touch/mouse
  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    drawingRef.current = true
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY
    lastRef.current = { x, y }
  }
  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastRef.current) return
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(lastRef.current.x, lastRef.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    lastRef.current = { x, y }
  }
  function endDraw() { drawingRef.current = false; lastRef.current = null }
  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }

  // 20-minute countdown
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setTimerDone(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [])

  // Auto-complete when timer runs out
  useEffect(() => {
    if (timerDone && phase !== 'done') {
      completeSubject()
    }
  }, [timerDone])

  function completeSubject() {
    markComplete(childId, subject)
    setPhase('done')
  }

  function checkAnswer() {
    if (!lesson) return
    const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ')
    const input = norm(answer)
    const correct = lesson.practice.acceptedAnswers.some(a => norm(a) === input)
    setAnswered(correct ? 'correct' : 'wrong')
    if (correct) {
      setPracticeDone(true)
      setTimeout(() => completeSubject(), 1200)
    }
  }

  function goNextLesson() {
    if (lessonIdx < lessons.length - 1) {
      setLessonIdx(lessonIdx + 1)
      setPhase('teach')
      setAnswer('')
      setAnswered(null)
    }
  }

  function goPrevLesson() {
    if (lessonIdx > 0) {
      setLessonIdx(lessonIdx - 1)
      setPhase('teach')
      setAnswer('')
      setAnswered(null)
    }
  }

  function goNextModule() {
    if (!toc) return
    const chapter = toc.chapters[chapIdx]
    if (!chapter) return
    setModuleContent(null)
    if (modIdx < chapter.modules.length - 1) {
      setModIdx(modIdx + 1)
    } else if (chapIdx < toc.chapters.length - 1) {
      setChapIdx(chapIdx + 1)
      setModIdx(0)
    }
  }

  function goPrevModule() {
    if (!toc) return
    setModuleContent(null)
    if (modIdx > 0) {
      setModIdx(modIdx - 1)
    } else if (chapIdx > 0) {
      const prevChap = toc.chapters[chapIdx - 1]
      setChapIdx(chapIdx - 1)
      setModIdx(prevChap.modules.length - 1)
    }
  }

  const currentChapter = toc?.chapters[chapIdx]
  const currentMod = currentChapter?.modules[modIdx]
  const totalModsSoFar = toc ? toc.chapters.slice(0, chapIdx).reduce((s, c) => s + c.modules.length, 0) + modIdx + 1 : 0

  async function analyzeProgress() {
    setAnalyzing(true)
    setAnalysisResult('')
    try {
      const progressKey = `daily_${childId}_${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`
      const dailyProgress = JSON.parse(localStorage.getItem(progressKey) || '{}')
      const res = await fetch(`${API_URL}/api/analyze-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          subject,
          grade,
          modulesViewed: totalModsSoFar,
          completedSubjects: Object.entries(dailyProgress).filter(([,v]) => v).map(([k]) => k),
          practiceCorrect: answered === 'correct',
        }),
      })
      const data = await res.json()
      setAnalysisResult(data.analysis || 'Unable to generate analysis.')
    } catch {
      setAnalysisResult('Analysis unavailable right now.')
    } finally {
      setAnalyzing(false)
    }
  }

  function goNext() {
    const nextSubject = SUBJECT_NEXT[subject]
    if (nextSubject) {
      router.push(`/basics/${childId}/${nextSubject}`)
    } else {
      router.push(`/dashboard/${childId}`)
    }
  }

  const minutes = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const progress = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100

  if (!lesson && !toc && !tocLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Content loading...</p>
          <button onClick={() => router.back()} className="text-slate-400 underline">Go back</button>
        </div>
      </div>
    )
  }

  // ── DONE screen ──
  if (phase === 'done') {
    const nextSubject = SUBJECT_NEXT[subject]
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-full bg-green-900/60 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">{SUBJECT_LABEL[subject]} done</h2>
        <p className="text-slate-400 text-sm mb-8">
          {nextSubject
            ? `Up next: ${SUBJECT_LABEL[nextSubject]}`
            : 'All morning work complete — the Harkness table is open'}
        </p>
        <button
          onClick={goNext}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-base hover:shadow-lg transition-all flex items-center gap-2"
        >
          {nextSubject ? `Start ${SUBJECT_LABEL[nextSubject]}` : 'Open the Harkness table'}
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="mt-6 w-full max-w-md">
          <button
            onClick={analyzeProgress}
            disabled={analyzing}
            className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-semibold text-sm hover:border-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : '⟡ Analyze my progress'}
          </button>
          {analysisResult && (
            <div className="mt-4 bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-slate-200 text-sm leading-relaxed whitespace-pre-line text-left">
              {analysisResult}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header: back · subject · lesson title · timer */}
      <header className="border-b border-slate-800 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push(`/dashboard/${childId}`)} className="text-slate-500 hover:text-white flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wide leading-none">{SUBJECT_LABEL[subject]}</p>
            <p className="text-slate-300 text-sm font-semibold truncate mt-0.5">
              {toc && currentMod ? `${totalModsSoFar}. ${currentMod.title}` : lesson?.title || ''}
            </p>
          </div>
          <div className={`flex-shrink-0 flex items-center gap-1 text-xs font-mono font-semibold ${secondsLeft < 300 ? 'text-amber-400' : 'text-slate-500'}`}>
            <Clock className="w-3.5 h-3.5" />
            {minutes}:{secs.toString().padStart(2, '0')}
          </div>
        </div>
        {/* Timer bar */}
        <div className="max-w-2xl mx-auto mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        {/* Phase tabs */}
        <div className="max-w-2xl mx-auto flex mt-2 gap-1">
          {(['teach', 'example', 'practice'] as const).map(p => (
            <button
              key={p}
              onClick={() => {
                if (p === 'example') setReadDone(true)
                if (p === 'practice') { setReadDone(true); setExampleDone(true) }
                setPhase(p)
              }}
              className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                phase === p ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {p === 'teach' ? 'Learn' : p === 'example' ? 'Example' : 'Practice'}
            </button>
          ))}
        </div>
        {/* Completion checklist */}
        <div className="max-w-2xl mx-auto mt-2 flex items-center gap-3 px-1">
          {[
            { label: 'Read', done: readDone },
            { label: 'Example', done: exampleDone },
            { label: 'Practice', done: practiceDone },
          ].map(step => (
            <div key={step.label} className={`flex items-center gap-1 text-xs font-medium ${step.done ? 'text-green-400' : 'text-slate-600'}`}>
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                {step.done && <span className="text-black text-[8px] font-bold">✓</span>}
              </span>
              {step.label}
            </div>
          ))}
          <span className="text-slate-700 text-xs ml-auto">Complete all 3 to advance</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">

          {/* TEACH */}
          {phase === 'teach' && (
            <div>
              {/* ToC dropdown */}
              {showToc && toc && (
                <div className="mb-5 bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-white font-bold text-sm">{toc.bookTitle}</span>
                    <span className="text-amber-400 text-xs font-semibold">{toc.totalModules} modules</span>
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
                    {toc.chapters.map((ch, ci) => (
                      <div key={ci} className="border-b border-slate-700/60 last:border-b-0">
                        <button
                          onClick={() => { setChapIdx(ci); setModIdx(0); setShowToc(false) }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${ci === chapIdx ? 'text-amber-400 bg-amber-950/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/40'}`}
                        >
                          Ch {ci + 1} — {ch.title}
                        </button>
                        {ci === chapIdx && ch.modules.map((mod, mi) => (
                          <button
                            key={mi}
                            onClick={() => { setModIdx(mi); setShowToc(false) }}
                            className={`w-full text-left px-6 py-2 text-xs transition-colors border-t border-slate-700/30 ${mi === modIdx ? 'text-amber-300 bg-amber-950/30' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/30'}`}
                          >
                            {mi + 1}. {mod.title}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic content */}
              {moduleContent && !modLoading ? (
                <div>
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <h2 className="text-white text-xl font-bold">{moduleContent.title}</h2>
                    <button
                      onClick={() => speakText([...moduleContent.learningOutcomes, ...moduleContent.paragraphs].join(' '))}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        ttsPlaying ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      {ttsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : ttsPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {ttsLoading ? '...' : ttsPlaying ? 'Stop' : 'Listen'}
                    </button>
                  </div>

                  {moduleContent.learningOutcomes.length > 0 && (
                    <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 mb-4">
                      <p className="text-amber-400 text-xs font-bold uppercase tracking-wide mb-2">Learning Objectives</p>
                      <ul className="space-y-1">
                        {moduleContent.learningOutcomes.map((lo, i) => (
                          <li key={i} className="text-amber-100/80 text-sm flex gap-2">
                            <span className="text-amber-500 flex-shrink-0">•</span>
                            <span>{lo}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-4">
                    {moduleContent.paragraphs.slice(0, 6).map((p, i) => (
                      <p key={i} className="text-slate-200 leading-relaxed text-base">{p}</p>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={goPrevModule}
                      disabled={chapIdx === 0 && modIdx === 0}
                      className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:border-slate-500 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </button>
                    <button
                      onClick={() => { setReadDone(true); setPhase('example') }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold flex items-center justify-center gap-2 text-sm"
                    >
                      Practice <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (readDone && exampleDone && practiceDone) {
                          goNextModule()
                          setReadDone(false)
                          setExampleDone(false)
                          setPracticeDone(false)
                        }
                      }}
                      disabled={
                        ((!readDone || !exampleDone || !practiceDone) && !timerDone) ||
                        (chapIdx >= (toc?.chapters.length ?? 1) - 1 && modIdx >= (currentChapter?.modules.length ?? 1) - 1)
                      }
                      title={readDone && exampleDone && practiceDone ? '' : 'Complete Read, Example, and Practice first'}
                      className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        (readDone && exampleDone && practiceDone) || timerDone
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold'
                          : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {(readDone && exampleDone && practiceDone) || timerDone ? 'Next' : 'Finish lesson first'} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : modLoading || tocLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-slate-400 text-sm">Loading {SUBJECT_BOOKS[subject]?.label}…</p>
                </div>
              ) : (
                // Fallback: static lesson content
                <div>
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <h2 className="text-white text-xl font-bold">{lesson?.title}</h2>
                    <button
                      onClick={() => lesson && speakText(lesson.teach)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        ttsPlaying ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      {ttsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : ttsPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {ttsPlaying ? 'Stop' : 'Listen'}
                    </button>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
                    <p className="text-slate-200 leading-relaxed whitespace-pre-line text-base">{lesson?.teach}</p>
                  </div>
                  <button
                    onClick={() => setPhase('example')}
                    className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold flex items-center justify-center gap-2"
                  >
                    See an example <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* EXAMPLE */}
          {phase === 'example' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white text-xl font-bold">Worked Example</h2>
                <button
                  onClick={() => speakText(`Here's the problem: ${lesson.example.problem}. Let me walk you through the steps. ${lesson.example.steps.join('. ')}. The answer is: ${lesson.example.answer}.`)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    ttsPlaying ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  {ttsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : ttsPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {ttsPlaying ? 'Stop' : 'Listen'}
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-5">{lesson.example.problem}</p>
              <div className="space-y-3 mb-6">
                {lesson.example.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-slate-200 text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
              <div className="bg-green-950/40 border border-green-800/50 rounded-xl p-4">
                <p className="text-green-400 font-semibold text-sm">Answer: {lesson.example.answer}</p>
              </div>
              <button
                onClick={() => { setExampleDone(true); setPhase('practice') }}
                className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold flex items-center justify-center gap-2"
              >
                Try it yourself <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* PRACTICE */}
          {phase === 'practice' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white text-xl font-bold">Your turn</h2>
                <button
                  onClick={() => speakText(lesson.practice.problem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 hover:text-white transition-all"
                >
                  {ttsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                  Read question
                </button>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-5">
                <p className="text-slate-200 text-base">{lesson.practice.problem}</p>
              </div>

              {showHint && (
                <div className="mb-4 flex gap-2 items-start bg-amber-950/40 border border-amber-800/40 rounded-xl p-4">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-200 text-sm">{lesson.practice.hint}</p>
                </div>
              )}

              <input
                type="text"
                value={answer}
                onChange={e => { setAnswer(e.target.value); setAnswered(null) }}
                onKeyDown={e => e.key === 'Enter' && checkAnswer()}
                placeholder="Type your answer here..."
                className="w-full px-5 py-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-base mb-3"
              />

              {answered === 'wrong' && (
                <div className="mb-3 flex gap-2 items-center text-red-400 text-sm">
                  <XCircle className="w-4 h-4" />
                  Not quite. Try again — check the hint.
                </div>
              )}
              {answered === 'correct' && (
                <div className="mb-3 flex gap-2 items-center text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Correct! Moving on...
                </div>
              )}

              <div className="flex gap-3">
                {!showHint && (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:border-slate-500 transition-all"
                  >
                    Need a hint?
                  </button>
                )}
                <button
                  onClick={checkAnswer}
                  disabled={!answer.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold disabled:opacity-30 transition-all"
                >
                  Check answer
                </button>
              </div>
            </div>
          )}


          {/* ── PHET SCIENCE SIMULATIONS ───────────────────── */}
          {subject === 'science' && (() => {
            const PHET_MAP: Record<string, {name: string; sim: string}> = {
              'Ecosystems: Energy Flow and What Happens When It Breaks': { name: 'Food Web', sim: 'food-web' },
              'The Scientific Method: How We Know What We Know': { name: 'Projectile Motion', sim: 'projectile-motion' },
              'Cells: What the Evidence Actually Tells Us': { name: 'Natural Selection', sim: 'natural-selection' },
              'Climate Science: Reading the Data': { name: 'Greenhouse Effect', sim: 'greenhouse-effect' },
            }
            const phet = PHET_MAP[lesson.title]
            if (!phet) return null
            return (
              <div className="mt-6">
                <a
                  href={`https://phet.colorado.edu/sims/html/${phet.sim}/latest/${phet.sim}_en.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-green-950/50 border border-green-800/50 text-green-300 text-sm font-semibold hover:border-green-600 transition-all"
                >
                  <span>PhET Simulation — {phet.name}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-xs text-slate-500 mt-1.5 pl-1">Opens in a new tab · Interactive · Free · University of Colorado Boulder</p>
              </div>
            )
          })()}

          {/* ── NASA MARS PHOTOS (science only) ─────────────── */}
          {subject === 'science' && marsPhotos.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowMars(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-orange-950/50 border border-orange-800/50 text-orange-300 text-sm font-semibold hover:border-orange-600 transition-all"
              >
                <span>Mars Live — Curiosity Rover Photos</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showMars ? 'rotate-90' : ''}`} />
              </button>
              {showMars && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-slate-500 pl-1">Real photos from the Martian surface · NASA Open API · Sol {marsPhotos[0]?.sol} ({marsPhotos[0]?.date})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {marsPhotos.map((p, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-slate-700">
                        <img src={p.url} alt={p.camera} className="w-full h-32 object-cover" loading="lazy" />
                        <p className="text-xs text-slate-500 px-2 py-1.5">{p.camera}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GOOGLE AI TOOLS (ai subject only) ─────────────── */}
          {subject === 'ai' && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wide pl-1 mb-3">Google Open Source AI Tools</p>
              {[
                { name: 'Teachable Machine', desc: 'Train your own AI model — no code needed', url: 'https://teachablemachine.withgoogle.com/', color: 'text-blue-300 border-blue-800/50 bg-blue-950/50 hover:border-blue-600' },
                { name: 'TensorFlow Playground', desc: 'See a neural network learn in real time', url: 'https://playground.tensorflow.org/', color: 'text-orange-300 border-orange-800/50 bg-orange-950/50 hover:border-orange-600' },
                { name: 'Blockly Games', desc: 'Learn coding logic through visual programming', url: 'https://blockly.games/', color: 'text-green-300 border-green-800/50 bg-green-950/50 hover:border-green-600' },
                { name: 'Quick, Draw!', desc: 'Google AI recognizes your doodles in real time', url: 'https://quickdraw.withgoogle.com/', color: 'text-purple-300 border-purple-800/50 bg-purple-950/50 hover:border-purple-600' },
              ].map(tool => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${tool.color}`}
                >
                  <div>
                    <p>{tool.name}</p>
                    <p className="text-xs text-slate-400 font-normal">{tool.desc}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 flex-shrink-0 ml-3" />
                </a>
              ))}
            </div>
          )}

          {/* ── DR. SEBI FOOD LIST REFERENCE (health only) ─────── */}
          {subject === 'health' && (
            <div className="mt-6">
              <details className="group">
                <summary className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-sm font-semibold hover:border-red-600 transition-all cursor-pointer list-none">
                  <span>Dr. Sebi Approved Food List — Quick Reference</span>
                  <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-3 bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4 text-sm">
                  {[
                    { cat: 'Grains', items: 'Spelt · Kamut · Teff · Quinoa · Wild rice · Amaranth · Fonio' },
                    { cat: 'Vegetables', items: 'Kale · Collard greens · Watercress · Dandelion · Bell peppers · Mushrooms · Avocado · Okra' },
                    { cat: 'Fruits', items: 'Mango · Banana · Elderberries · Soursop · Sea grapes · Apples · Pears · Berries' },
                    { cat: 'Nuts & Seeds', items: 'Brazil nuts · Hemp seeds · Walnuts · Sesame seeds · Raw almonds' },
                    { cat: 'Sea Plants', items: 'Sea moss (92 minerals) · Bladderwrack · Nori · Dulse' },
                    { cat: 'Oils', items: 'Avocado oil · Grape seed oil · Hemp oil · Coconut oil (raw)' },
                    { cat: 'Sweeteners', items: 'Pure agave nectar · Date sugar · Coconut sugar' },
                  ].map(({ cat, items }) => (
                    <div key={cat}>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{cat}</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{items}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* ── DAILY WORD PROBLEM (math only) ─────────────── */}
          {subject === 'math' && wordProblem && (
            <div className="mt-6">
              <button
                onClick={() => { setShowWordProblem(v => !v); setShowWPAnswer(false) }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-blue-950/50 border border-blue-800/50 text-blue-300 text-sm font-semibold hover:border-blue-600 transition-all"
              >
                <span>Daily Challenge — Word Problem</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showWordProblem ? 'rotate-90' : ''}`} />
              </button>
              {showWordProblem && (
                <div className="mt-3 bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                  <p className="text-slate-100 text-sm leading-relaxed">{wordProblem.question}</p>
                  {wordProblem.steps.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Step-by-step hints</p>
                      {wordProblem.steps.map((s, i) => (
                        <div key={i} className="text-xs text-slate-400 bg-slate-900/60 rounded-lg px-3 py-2">
                          <span className="text-amber-400 font-semibold">{s.hint}</span>
                          {showWPAnswer && <span className="text-slate-300 ml-2">→ {s.solution}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setShowWPAnswer(v => !v)}
                    className="text-xs text-amber-400 underline"
                  >
                    {showWPAnswer ? `Hide answer (${wordProblem.answer})` : 'Reveal answer'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── SCRATCH PAD ─────────────────────────────────── */}
          <div className="mt-6">
            <button
              onClick={() => setShowScratchpad(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 text-sm font-semibold hover:text-slate-300 hover:border-slate-500 transition-all"
            >
              <span>Scratch Paper — draw your working</span>
              <div className="flex items-center gap-2">
                {showScratchpad && (
                  <button
                    onClick={e => { e.stopPropagation(); clearCanvas() }}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <ChevronRight className={`w-4 h-4 transition-transform ${showScratchpad ? 'rotate-90' : ''}`} />
              </div>
            </button>
            {showScratchpad && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-700">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={280}
                  className="w-full bg-slate-900 touch-none cursor-crosshair"
                  style={{ maxHeight: '280px' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
