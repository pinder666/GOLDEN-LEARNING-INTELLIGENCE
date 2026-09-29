'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Clock, ChevronRight, Lightbulb, Volume2, VolumeX, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500'

const CHILD_INFO: Record<string, { name: string; grade: number }> = {
  jus: { name: 'Jus', grade: 5 },
  uni: { name: 'Uni', grade: 8 },
}

const SUBJECT_NEXT: Record<string, string> = {
  math: 'reading',
  reading: 'science',
  science: 'ai',
  ai: 'finance',
  finance: null as any,
}

const SUBJECT_LABEL: Record<string, string> = {
  math: 'Math',
  reading: 'Reading & Writing',
  science: 'Science',
  ai: 'AI Literacy',
  finance: 'Finance Literacy',
}

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
  const lesson = lessons[0] // one lesson per subject for now

  const [phase, setPhase] = useState<'teach' | 'example' | 'practice' | 'done'>('teach')
  const [answer, setAnswer] = useState('')
  const [answered, setAnswered] = useState<'correct' | 'wrong' | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [timerDone, setTimerDone] = useState(false)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
      setTimeout(() => completeSubject(), 1200)
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

  if (!lesson) {
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header + timer */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push(`/dashboard/${childId}`)} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-white font-bold">{SUBJECT_LABEL[subject]}</h1>
            <p className="text-slate-500 text-xs">{lesson.title}</p>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-mono font-semibold ${secondsLeft < 300 ? 'text-amber-400' : 'text-slate-400'}`}>
            <Clock className="w-4 h-4" />
            {minutes}:{secs.toString().padStart(2, '0')}
          </div>
        </div>
        {/* Timer bar */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Phase tabs */}
          <div className="flex mt-3 gap-1">
            {(['teach', 'example', 'practice'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  phase === p
                    ? 'bg-amber-500 text-black'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {p === 'teach' ? 'Learn' : p === 'example' ? 'Example' : 'Practice'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">

          {/* TEACH */}
          {phase === 'teach' && (
            <div>
              <div className="flex items-start justify-between gap-3 mb-5">
                <h2 className="text-white text-xl font-bold">{lesson.title}</h2>
                <button
                  onClick={() => speakText(lesson.teach)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    ttsPlaying ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                  title="Listen to this lesson"
                >
                  {ttsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : ttsPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {ttsLoading ? 'Loading...' : ttsPlaying ? 'Stop' : 'Listen'}
                </button>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
                <p className="text-slate-200 leading-relaxed whitespace-pre-line text-base">{lesson.teach}</p>
              </div>
              <button
                onClick={() => setPhase('example')}
                className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold flex items-center justify-center gap-2"
              >
                See an example <ArrowRight className="w-5 h-5" />
              </button>
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
                onClick={() => setPhase('practice')}
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
        </div>
      </main>
    </div>
  )
}
