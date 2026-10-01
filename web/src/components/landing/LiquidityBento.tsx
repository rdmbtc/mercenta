"use client";
import {
  Coins,
  HandCoins,
  CreditCard,
  Bot,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
export function LiquidityBento() {
  return (
    <section className="mx-liquidity" id="liquidity">
      <div className="mx-wrap">
        <div className="mx-section-meta">
          <span className="mx-label">THE CAPITAL LAYER / CIRCLE + ARC</span>
          <a className="mx-text-link" href="/app?section=liquidity">
            Open liquidity <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="mx-liquidity-heading">
          <h2>
            Your supply.
            <br />
            <span>Your working capital.</span>
          </h2>
          <p>
            A visible treasury workspace for reserves, collateral and funding.
            Let agents advise. Keep execution inside your rules.
          </p>
        </div>
        <div className="mx-liquidity-bento">
          <a
            className="mx-liquidity-earn"
            href="/app?section=liquidity&tab=earn"
          >
            <div>
              <Coins size={26} />
              <span className="mx-label">EARN USDC</span>
              <span className="mx-liquidity-tag">RATE MODEL</span>
            </div>
            <h3>
              Idle capital.
              <br />
              An active plan.
            </h3>
            <p>
              Model how free USDC reserves could earn while preserving operating
              liquidity.
            </p>
            <div className="mx-liquidity-rate">
              <strong>
                5.4<span>%</span>
              </strong>
              <span>
                APY assumption
                <br />
                <small>Not a live vault quote</small>
              </span>
            </div>
            <footer>
              Explore Earn Vaults <ArrowRight size={19} />
            </footer>
          </a>
          <a
            className="mx-liquidity-borrow"
            href="/app?section=liquidity&tab=borrow"
          >
            <div>
              <HandCoins size={26} />
              <span className="mx-label">BORROW VS CIRBTC</span>
              <span className="mx-liquidity-tag">RISK MODEL</span>
            </div>
            <h3>
              Keep the Bitcoin.
              <br />
              Explore the liquidity.
            </h3>
            <p>
              Compare collateral, USDC debt and liquidation risk without selling
              the model collateral.
            </p>
            <div className="mx-liquidity-rate">
              <strong>
                75<span>%</span>
              </strong>
              <span>
                Maximum model LTV
                <br />
                <small>No live loan executed</small>
              </span>
            </div>
            <footer>
              Model working capital <ArrowRight size={19} />
            </footer>
          </a>
          <a
            className="mx-liquidity-onramp"
            href="/app?section=liquidity&tab=onramp"
          >
            <div>
              <CreditCard size={24} />
              <span className="mx-label">FIAT ONRAMP</span>
            </div>
            <h3>Card → USDC → Arc.</h3>
            <p>
              Preview card and Apple Pay funding. Hosted checkout needs Circle
              configuration.
            </p>
            <footer>
              Explore the sandbox <ArrowUpRight size={18} />
            </footer>
          </a>
          <button
            className="mx-liquidity-agent"
            onClick={() =>
              document
                .querySelector<HTMLButtonElement>(".ml-chat-trigger")
                ?.click()
            }
          >
            <div>
              <Bot size={24} />
              <span className="mx-label">AI ADVISORY</span>
              <span className="mx-liquidity-tag">10 FREE REQUESTS</span>
            </div>
            <h3>
              A proposal.
              <br />
              Never a blank check.
            </h3>
            <p>
              Compare resources and treasury choices with a clearly labelled
              advisor. The LLM has zero financial authority.
            </p>
            <footer>
              Ask Mercenta <ArrowRight size={18} />
            </footer>
          </button>
        </div>
        <p className="mx-liquidity-disclaimer">
          <ShieldCheck size={16} />
          Interactive models, not live financial offers. No real deposit, loan
          or card payment is executed by this preview.
        </p>
      </div>
    </section>
  );
}
