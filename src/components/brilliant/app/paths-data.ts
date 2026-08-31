/**
 * The 13 learning paths on brilliant.org/courses/, read out of the live DOM:
 * eyebrow, title, subtitle, progress, age badge, category art and every course
 * tile with its title, source href and art. Nothing here is written by hand.
 *
 * `starred` marks the two rows the account had saved — the original renders
 * those under "Your learning paths" and the rest under "Other learning paths".
 *
 * The Python in here is Brilliant's, not ours. "Thinking in Python" is a real
 * course on a real site, this tree is a verbatim reproduction of it, and
 * `/brilliant/**` 404s outside development (`tests/school/routes.test.ts`). A
 * migration that renamed it to C++ would break the only baseline the product's
 * own pages are measured against, and would put a course name on a page that
 * the site it copies does not have. Leave it.
 */

const CAT = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/category-images";
const CH = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter";

export interface PathTile {
  title: string;
  href: string;
  img: string;
  /** 0..1, present only on courses that have been started. */
  progress?: number;
}

export interface LearningPath {
  title: string;
  eyebrow: string;
  sub: string;
  age?: string;
  percent?: string;
  catImg: string;
  starred: boolean;
  tiles: PathTile[];
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    title: "Programming & CS",
    eyebrow: "FOUNDATIONAL",
    sub: "Speak the language of computers",
    age: "ALL AGES",
    percent: "1% complete",
    catImg: `${CAT}/Computer_Science-JEbqeF.png`,
    starred: true,
    tiles: [
      { title: "Thinking in Code", href: "/courses/thinking-in-code/", img: `${CH}/thinking-in-code-DolooX.png` },
      { title: "Programming with Variables", href: "/courses/creative-coding/", img: `${CH}/creative-coding-dsGE0e.png` },
      { title: "Programming with Functions", href: "/courses/pixel-pusher/", img: `${CH}/Programming_with_Functions-NL91vb.png` },
      { title: "Algorithmic Thinking", href: "/courses/algorithms-greedy-dp/", img: `${CH}/Algorithmic_Thinking-ZSOEgi.png`, progress: 0.08 },
      { title: "Computer Science Fundamentals", href: "/courses/computer-science-algorithms/", img: `${CH}/computer-science-algorithms-jF6RDo.png`, progress: 0.05 },
      { title: "How AI Works", href: "/courses/how-llms-work/", img: `${CH}/how-llms-work-xk99Hz.png` },
      { title: "Introduction to Neural Networks", href: "/courses/intro-neural-networks/", img: `${CH}/intro-neural-networks-jAxpjj.png` },
    ],
  },
  {
    title: "Data Analysis",
    eyebrow: "INTERMEDIATE",
    sub: "Know your stuff in probability and data analysis",
    catImg: `${CAT}/Data-QPQ8Ve.png`,
    starred: true,
    tiles: [
      { title: "Exploring Data Visually", href: "/courses/visual-exploration/", img: `${CH}/total-AuJUe6.png` },
      { title: "Probability in Data", href: "/courses/probability-fundamentals/", img: `${CH}/probability-fundamentals-nsVvo6.png` },
      { title: "Clustering & Classification", href: "/courses/clustering--classification/", img: `${CH}/skip-Clustering-9m6GmH.png` },
      { title: "Regression", href: "/courses/explaining-variation/", img: `${CH}/explaining-variation-QDWLIX.png` },
      { title: "Predicting with Probability", href: "/courses/probabilistic-prediction/", img: `${CH}/probabilistic-prediction-cDrWMA.png` },
    ],
  },
  {
    title: "Math Foundations",
    eyebrow: "GRADES 4–7",
    sub: "Strengthen pre-algebra skills in later elementary and early middle school",
    age: "GRADES 4–7",
    catImg: `${CAT}/Foundations_of_Algebra-6MUKk8.png`,
    starred: false,
    tiles: [
      { title: "Fractions", href: "/courses/math-fundamentals/", img: `${CH}/Arithmetic_Thinking-KaQBTB.png` },
      { title: "Solving Equations", href: "/courses/pre-algebra/", img: `${CH}/pre-algebra-LxbQq6.png` },
      { title: "Negative Numbers", href: "/courses/negative-numbers/", img: `${CH}/Negative_Numbers-KDpY7n.png` },
      { title: "Coordinate Plane", href: "/courses/coordinate-plane/", img: `${CH}/Coordinate_Plane-TjmV5y.png` },
      { title: "Percents", href: "/courses/percentages/", img: `${CH}/Percents-m6xEg2.png` },
      { title: "Proportional Reasoning", href: "/courses/proportional-relationships/", img: `${CH}/Proportional_Reasoning-5aofQr.png` },
    ],
  },
  {
    title: "Algebra Fundamentals",
    eyebrow: "GRADES 7–9",
    sub: "Build algebra tools for success in middle grades and beyond",
    age: "GRADES 7–9",
    catImg: `${CAT}/Foundational_Math-wv6lLw.png`,
    starred: false,
    tiles: [
      { title: "Linear Equations", href: "/courses/linear-expressions-and-equations/", img: `${CH}/Linear_Equations_1-KOclY7.png` },
      { title: "Coordinate Geometry", href: "/courses/coordinate-geometry/", img: `${CH}/Coordinate_Geometry-bgclJY.png` },
      { title: "Linear Relationships", href: "/courses/linear-functions/", img: `${CH}/Linear_Functions-uZpt3z.png` },
      { title: "Exponents and Radicals", href: "/courses/exponents-and-radicals/", img: `${CH}/Exponents_and_Radicals-ql92EE.png` },
      { title: "Visual Algebra", href: "/courses/systems-of-equations/", img: `${CH}/Visual_Algebra_1-wiJeeI.png` },
    ],
  },
  {
    title: "Intermediate Algebra",
    eyebrow: "GRADES 8–11",
    sub: "Understand core ideas to crush early high school courses like Algebra 1 or Integrated Math 1 and 2",
    age: "GRADES 8–11",
    catImg: `${CAT}/VersionDefault-nTCdZP.png`,
    starred: false,
    tiles: [
      { title: "Introduction to Functions", href: "/courses/introduction-to-functions/", img: `${CH}/Introduction_to_Functions-apEPPm.png` },
      { title: "Linear Systems", href: "/courses/linear-systems/", img: `${CH}/Linear_Systems-dEvpsN.png` },
      { title: "Quadratics", href: "/courses/quadratics/", img: `${CH}/Quadratics-ltqHFa.png` },
      { title: "Coordinate Transformations", href: "/courses/transformations/", img: `${CH}/Transformations-Qj86QE.png` },
      { title: "Exponentials and Logarithms", href: "/courses/exponential-functions/", img: `${CH}/Exponential_Functions-fRmu9W.png` },
    ],
  },
  {
    title: "Advanced Algebra",
    eyebrow: "GRADES 11–12",
    sub: "Study the functions and graphs of later high school courses like Algebra 2, Integrated Math 2 and 3, and Precalculus",
    age: "GRADES 11–12",
    catImg: `${CAT}/Advanced_Algebra-oWV2Cs.png`,
    starred: false,
    tiles: [
      { title: "Trigonometric Functions", href: "/courses/trigonometric-functions/", img: `${CH}/Trigonometric_Functions-xayhLE.png` },
      { title: "Polar Coordinate Plane", href: "/courses/polar-coordinate-plane/", img: `${CH}/Polar_Coordinates-yDI3Po.png` },
      { title: "Complex Numbers", href: "/courses/complex-plane/", img: `${CH}/Complex_Numbers-ZEqaF7.png` },
      { title: "Polynomials", href: "/courses/polynomials/", img: `${CH}/Polynomials-yvRWkg.png` },
      { title: "Equations and Curves", href: "/courses/equations-and-curves/", img: `${CH}/Equations_and_Curves-6om9pv.png` },
      { title: "Vectors and Matrices", href: "/courses/vectors/", img: `${CH}/Vectors-43nO1R.png` },
    ],
  },
  {
    title: "Python",
    eyebrow: "INTERMEDIATE",
    sub: "Translate ideas into powerful code",
    catImg: `${CAT}/Python-nknyB5.png`,
    starred: false,
    tiles: [
      { title: "Thinking in Python", href: "/courses/thinking-in-python/", img: `${CH}/tip_course_card-67QnUj.png` },
      { title: "Functions in Python", href: "/courses/functions-in-python/", img: `${CH}/Functions_in_Python-8aTmlc.png` },
      { title: "Recursion in Python", href: "/courses/recursion-in-python/", img: `${CH}/Recursion_in_Python_1-FEJb29.png` },
      { title: "Algorithms in Python", href: "/courses/algorithms-in-python/", img: `${CH}/Algorithms_in_Python-sttSbf.png` },
      { title: "Object-Oriented Programming in Python", href: "/courses/objects-in-python/", img: `${CH}/OOPiP_Course_Card-nVtxSh.png` },
      { title: "Data Structures in Python", href: "/courses/data-structures-in-python/", img: `${CH}/DSiP_course_card-0cZaC4.png` },
    ],
  },
  {
    title: "Science",
    eyebrow: "FOUNDATIONAL TO ADVANCED",
    sub: "See the science in the world around you",
    age: "ALL AGES",
    catImg: `${CAT}/Science-eBE22L.png`,
    starred: false,
    tiles: [
      { title: "Scientific Thinking", href: "/courses/puzzle-science/", img: `${CH}/puzzle-science-vL2Jb1.png` },
      { title: "Circuits", href: "/courses/circuits/", img: `${CH}/physics-everyday_1-3m6imB.png` },
      { title: "Digital Circuits", href: "/courses/digital-circuits/", img: `${CH}/Frame_316134040-IrxF89.png` },
      { title: "Kurzgesagt – Beyond the Nutshell", href: "/courses/nutshell/", img: `${CH}/nutshell-mIGflD.png` },
      { title: "Science Puzzles", href: "/courses/science-puzzles-long-set/", img: `${CH}/science-puzzles-long-set-yRNtzP.png` },
      { title: "Quantum Computing", href: "/courses/quantum-computing/", img: `${CH}/quantum-computing-3HvKZl.png` },
    ],
  },
  {
    title: "Logical Reasoning",
    eyebrow: "INTERMEDIATE",
    sub: "Sharpen your reasoning skills",
    age: "ALL AGES",
    catImg: `${CAT}/Logic-0bR4IX.png`,
    starred: false,
    tiles: [
      { title: "Logic", href: "/courses/logic-deduction/", img: `${CH}/logic-deduction-fHm1JW.png` },
      { title: "Truth and Lies", href: "/courses/grid-logic/", img: `${CH}/Toggle_Logic_Course_Card-MGztCN.png` },
      { title: "Digital Circuits", href: "/courses/digital-circuits/", img: `${CH}/Frame_316134040-IrxF89.png` },
      { title: "Reasoning with Logic", href: "/courses/logical-languages/", img: `${CH}/logical-languages-PaiPd6.png` },
    ],
  },
  {
    title: "Everyday Math",
    eyebrow: "FOUNDATIONAL",
    sub: "Apply math reasoning to practical contexts",
    catImg: `${CAT}/everyday_math_course_card_default-i2MtUw.png`,
    starred: false,
    tiles: [
      { title: "Everyday Statistics", href: "/courses/basic-math/", img: `${CH}/Everyday_Stats-owr7OU.png` },
      { title: "Probability and Chance", href: "/courses/winning-with-probability/", img: `${CH}/Probability_And_Chance-qRuc60.png` },
      { title: "Geometry and Measurement", href: "/courses/geometry-fundamentals/", img: `${CH}/geometry-fundamentals-YodL7x.png` },
      { title: "Real-World Algebra", href: "/courses/using-variables/", img: `${CH}/using-variables-iy9wL7.png` },
    ],
  },
  {
    title: "Technology",
    eyebrow: "INTERMEDIATE",
    sub: "Deepen your knowledge of how things work",
    catImg: `${CAT}/Technology-JFXNyW.png`,
    starred: false,
    tiles: [
      { title: "How AI Works", href: "/courses/how-llms-work/", img: `${CH}/how-llms-work-xk99Hz.png` },
      { title: "Digital Circuits", href: "/courses/digital-circuits/", img: `${CH}/Frame_316134040-IrxF89.png` },
      { title: "How Technology Works", href: "/courses/how-computers-work/", img: `${CH}/how-computers-work-Q3myzq.png` },
      { title: "Search Engines", href: "/courses/search-fundamentals/", img: `${CH}/search-fundamentals-G1nv3e.png` },
      { title: "Cryptocurrency", href: "/courses/cryptocurrency/", img: `${CH}/cryptocurrency-8FJEOZ.png` },
      { title: "Quantum Computing", href: "/courses/quantum-computing/", img: `${CH}/quantum-computing-3HvKZl.png` },
    ],
  },
  {
    title: "Advanced Math",
    eyebrow: "ADVANCED",
    sub: "Dive into key ideas in derivatives, integrals, vectors, and beyond",
    catImg: `${CAT}/Advanced_Math-1pGcod.png`,
    starred: false,
    tiles: [
      { title: "Calculus", href: "/courses/calculus-nutshell/", img: `${CH}/calculus-nutshell-U2ccQk.png` },
      { title: "Vectors and Matrices", href: "/courses/vectors/", img: `${CH}/Vectors-43nO1R.png` },
    ],
  },
  {
    title: "Mind-Bending Math",
    eyebrow: "FOUNDATIONAL TO ADVANCED",
    sub: "Stretch your mind to infinity",
    catImg: `${CAT}/Mind-bending_Math-TcrRkW.png`,
    starred: false,
    tiles: [
      { title: "100 Days of Puzzles", href: "/courses/puzzles-100/", img: `${CH}/puzzles-100-pLCnZk.png` },
      { title: "Strategy Puzzles", href: "/courses/strategic-puzzles-long-set/", img: `${CH}/strategic-puzzles-long-set-W1RfF3.png` },
      { title: "Math Puzzles", href: "/courses/foundation-puzzles-long-set/", img: `${CH}/foundation-puzzles-long-set-gYC4xn.png` },
      { title: "Infinity", href: "/courses/infinity/", img: `${CH}/infinity-cbyEwd.png` },
      { title: "Number Theory", href: "/courses/basic-number-theory/", img: `${CH}/basic-number-theory-aLh2ND.png` },
      { title: "Geometric Thinking", href: "/courses/basic-2d-geometry/", img: `${CH}/basic-2d-geometry-Lgl7fm.png` },
      { title: "Bayesian Probability", href: "/courses/knowledge-and-uncertainty/", img: `${CH}/knowledge-and-uncertainty-TdnBt2.png` },
      { title: "Contest Math", href: "/courses/math-competition-fundamentals/", img: `${CH}/math-competition-fundamentals-ifmZin.png` },
    ],
  },
];
