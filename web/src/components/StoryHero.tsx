"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import {
  CASES,
  ORDER,
  POLICY,
  evaluatePolicy,
  percent,
  usdc,
} from "@/lib/policy";
import css from "./StoryHero.module.css";

const HEADLINE_LEAD = "Your agent can buy things.";
const HEADLINE_ANSWERS = [
  "It still cannot overspend.",
  "It cannot buy from a stranger.",
  "It cannot sell at a loss.",
  "It waits for you past the limit.",
];

function Words({
  text,
  delay,
  className,
  reduced,
}: {
  text: string;
  delay: number;
  className?: string;
  reduced: boolean;
}) {
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={word + index}
          className={css.word}
          initial={reduced ? false : { opacity: 0, y: "0.42em" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.62,
            delay: reduced ? 0 : delay + index * 0.055,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {index === words.length - 1 ? word : word + " "}
        </motion.span>
      ))}
    </span>
  );
}

export default function StoryHero() {
  const reduced = useReducedMotion() ?? false;
  const heroRef = useRef<HTMLElement>(null);

  // Rotating answer line: one promise at a time, blue-lit like the atmosphere.
  const [answerIndex, setAnswerIndex] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(
      () => setAnswerIndex((i) => (i + 1) % HEADLINE_ANSWERS.length),
      2600,
    );
    return () => clearInterval(id);
  }, [reduced]);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const cardY = useTransform(heroProgress, [0, 1], ["0px", "-72px"]);
  const cardScale = useTransform(heroProgress, [0, 1], [1, 0.94]);
  const cardOpacity = useTransform(heroProgress, [0, 0.72, 1], [1, 1, 0.32]);

  const result = evaluatePolicy(
    CASES.order.amount,
    CASES.order.cost,
    CASES.order.supplier,
  );

  const facts = [
    {
      term: "Money the agent may touch",
      detail: usdc(POLICY.availableToSpend),
      tone: "ok" as const,
    },
    {
      term: "Anything above this waits for you",
      detail: usdc(POLICY.autoApprovalLimit),
      tone: "hold" as const,
    },
    {
      term: "Say-so the model gets",
      detail: "None",
      tone: "stop" as const,
    },
  ];

  return (
    <>
      <motion.div
        className={css.progress}
        style={{ scaleX: progress }}
        aria-hidden="true"
      />

      <section className="hero" aria-labelledby="hero-title" ref={heroRef}>
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-tags">
              <span className="chip chip--accent">
                <Sparkles size={12} aria-hidden="true" /> Spending guardrails for
                AI agents
              </span>
            </p>

            <h1 id="hero-title" className={css.headline}>
              <Words
                text={HEADLINE_LEAD}
                delay={0.1}
                className={css.quiet}
                reduced={reduced}
              />{" "}
<Words
  text={HEADLINE_ANSWERS[answerIndex] ?? HEADLINE_ANSWERS[0]!}
  key={answerIndex}
  delay={0.52}
  className={css.answer + " " + css.answerLive}
  reduced={reduced}
/>
            </h1>

            <p className="hero-lead">
              Mercenta sits between your AI agent and your money. The agent picks
              what to buy. Mercenta checks the price, the margin and the limit
              first, then either pays or stops. Every answer is the same every
              time, because no model gets a vote.
            </p>

            <div className="hero-actions">
              <a className="btn btn--primary" href="#story">
                See how one purchase goes
                <ArrowRight size={15} aria-hidden="true" />
              </a>
              <a className="btn btn--ghost" href="#try">
                Try it on this page
              </a>
            </div>

            <dl className="hero-facts" aria-label="The rules in this example">
              {facts.map((fact) => (
                <div key={fact.term}>
                  <dt>
                    <span
                      className={css.factMark}
                      data-tone={fact.tone}
                      aria-hidden="true"
                    />
                    {fact.term}
                  </dt>
                  <dd>{fact.detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          <motion.div
            className={"hero-visual " + css.cardWrap}
            style={
              reduced
                ? undefined
                : { y: cardY, scale: cardScale, opacity: cardOpacity }
            }
          >
            <div className="order-card">
              <div className="order-card-top">
                <span className="order-card-path">
                  {ORDER.units} {ORDER.unit} · {ORDER.supplier}
                </span>
                <span className="chip">Example</span>
              </div>

              <dl className="order-card-rows">
                <div>
                  <dt>The agent wants to buy</dt>
                  <dd>{ORDER.listing}</dd>
                </div>
                <div>
                  <dt>It would charge the customer</dt>
                  <dd>{usdc(CASES.order.amount)}</dd>
                </div>
                <div>
                  <dt>The supplier wants</dt>
                  <dd>{usdc(CASES.order.cost)}</dd>
                </div>
                <div>
                  <dt>So you keep</dt>
                  <dd>
                    {percent(result.margin)} — your floor is{" "}
                    {percent(POLICY.grossMarginFloor)}
                  </dd>
                </div>
              </dl>

              <ul className="checklist order-card-checks">
                {result.checks.map((check) => (
                  <li key={check.id} className={"check-row check-" + check.state}>
                    <span className="check-mark" aria-hidden="true">
                      ✓
                    </span>
                    <span className="check-label">{check.label}</span>
                    <span className="check-note">{check.note}</span>
                  </li>
                ))}
              </ul>

              <p className="order-card-verdict">
                <b className="tone-ok">{result.decision}</b> — all five rules
                agreed, so the purchase may go ahead.
              </p>
            </div>

            <p className={css.cardCaption}>
              This card runs in your browser. Nothing is submitted, nothing is
              charged, no money moves.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
