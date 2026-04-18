import { useMemo, useState } from 'react';
import { Card, TextInput } from '../components/ui';

interface LibraryCard {
  id: string;
  title: string;
  blurb: string;
  body: React.ReactNode;
  tags: string[];
}

const CARDS: LibraryCard[] = [
  {
    id: 'simple3',
    title: 'The Simple 3-Part View (and why it is incomplete)',
    blurb: 'Costs, product, revenue — why this is where first-time founders get stuck.',
    tags: ['fundamentals', 'mental-model'],
    body: (
      <>
        <p>
          The intuitive picture of a business has three parts: <strong>costs</strong> (what
          you spend), a <strong>product</strong> or service, and <strong>revenue</strong>{' '}
          (what customers pay). Make revenue greater than costs and you have a business.
        </p>
        <p>
          Technically correct. Practically dangerous. The view is missing the distinctions
          that decide whether a business can actually survive:
        </p>
        <ul>
          <li>Fixed costs vs variable costs.</li>
          <li>Per-unit economics (can a single sale ever be profitable?).</li>
          <li>Gross margin and contribution margin.</li>
          <li>Moats and pricing power.</li>
        </ul>
        <p>
          Most first-time founders build a business with this simple view and fail the moment
          reality stress-tests the model — an empty month, a rent increase, a new competitor.
        </p>
      </>
    ),
  },
  {
    id: 'fixed-variable',
    title: 'Fixed vs Variable Costs',
    blurb: 'Fixed costs run whether or not a customer shows up. Variable costs scale with each sale.',
    tags: ['fundamentals', 'costs'],
    body: (
      <>
        <p>
          <strong>Fixed costs</strong> are paid regardless of customers: rent, salaries,
          insurance, software subscriptions. The meter runs before you earn anything. High
          fixed costs are the silent killer — they force you to hit volume before cash runs
          out.
        </p>
        <p>
          <strong>Variable costs</strong> scale with each customer: materials, platform fees,
          payment processing, fulfillment. They decide whether an individual sale is even
          profitable.
        </p>
        <p>
          <strong>Why it matters:</strong> fixed costs determine your <em>breakeven</em>.
          Variable costs determine whether each sale even <em>should happen</em>. If your
          variable cost exceeds your price, more sales make you more broke — faster.
        </p>
      </>
    ),
  },
  {
    id: 'unit-economics',
    title: 'Unit Economics — The Foundation',
    blurb: 'A "unit" is what you sell. Know per-unit numbers before anything else.',
    tags: ['fundamentals', 'unit-economics'],
    body: (
      <>
        <p>A <strong>unit</strong> is the smallest thing you sell:</p>
        <ul>
          <li>One restaurant meal, or one diner's average ticket.</li>
          <li>One subscription month for SaaS.</li>
          <li>One booking-night for shortlet.</li>
          <li>One delivery for e-commerce.</li>
        </ul>
        <p>
          <strong>Contribution margin per unit</strong> = price per unit − variable cost per
          unit. This is the money each sale contributes toward your fixed costs and
          eventually profit.
        </p>
        <p>
          <strong>Breakeven units per month</strong> = fixed costs ÷ contribution margin per
          unit. Below this, you lose money. Above it, you print profit.
        </p>
        <p>
          <strong>Why totals lie:</strong> you can have "lots of bookings" or "growing
          revenue" and still bleed money. If each unit's contribution is negative, volume
          accelerates the losses. Per-unit numbers are the only honest scoreboard.
        </p>
      </>
    ),
  },
  {
    id: 'margins',
    title: 'Margin Benchmarks by Industry',
    blurb: 'Choose the right game. Software engineers choosing restaurants are choosing hard mode.',
    tags: ['fundamentals', 'benchmarks'],
    body: (
      <>
        <table className="w-full text-sm mb-3">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="text-left py-2">Business type</th>
              <th className="text-left py-2">Typical net margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <Tr label="Grocery" value="1–3% (brutal)" />
            <Tr label="Restaurants" value="3–9% (most fail)" />
            <Tr label="Shortlet / Hotels" value="5–20% (capital intensive, fragile)" />
            <Tr label="Services / Agency" value="10–30% (depends on talent)" />
            <Tr label="E-commerce" value="5–15%" />
            <Tr label="SaaS (gross margin)" value="70–90% (why tech eats the world)" />
          </tbody>
        </table>
        <p>
          If you are a software engineer and you go run a restaurant, you are choosing to
          play on hard mode. A SaaS idea with the same effort can be 10–20× more forgiving in
          pure margin terms. Choose the game, then execute.
        </p>
      </>
    ),
  },
  {
    id: '4-questions',
    title: 'The 4 Critical Questions',
    blurb: 'Unit economics. Moat. Pricing power. Downside risk.',
    tags: ['framework'],
    body: (
      <>
        <ol>
          <li>
            <strong>Unit economics.</strong> Do the per-unit numbers work — validated with
            real research, not optimism? Good answer: "At £100/unit with £35 variable cost we
            have 65% contribution margin; verified against three competitors." Bad: "I think
            we can charge £200." Hope is not an input.
          </li>
          <li>
            <strong>Moat.</strong> Why can't a competitor copy this in 6 months? Good: "Our
            data flywheel compounds — every user improves the recommendation engine." Bad:
            "We'll just execute better." Execution alone is not a moat.
          </li>
          <li>
            <strong>Pricing power.</strong> Can you raise prices 10% without losing most
            customers? Good: "Our customers depend on us daily; switching costs them weeks."
            Bad: "If we raise prices we'll lose everyone." That is the signal you are a
            price-taker.
          </li>
          <li>
            <strong>Downside risk.</strong> If revenue drops 30% for 3 months, do you
            survive? Good: "12 months of runway, low fixed costs, variable-heavy model." Bad:
            "If anything goes wrong we're done."
          </li>
        </ol>
      </>
    ),
  },
  {
    id: 'moats',
    title: 'Moats Explained',
    blurb: 'Network effects, proprietary tech, brand, switching costs, data, regulatory, scale, exclusivity.',
    tags: ['framework', 'moats'],
    body: (
      <>
        <ul>
          <li><strong>Network effects</strong> — Facebook, WhatsApp. Each new user makes the product more valuable for every other user.</li>
          <li><strong>Proprietary technology</strong> — Nvidia GPUs, ASML lithography. Patents or genuinely hard-to-replicate engineering.</li>
          <li><strong>Brand</strong> — Coca-Cola, Hermès. Customers pay more because of who you are.</li>
          <li><strong>Switching costs</strong> — Salesforce, SAP. Painful (data, training, integration) to leave.</li>
          <li><strong>Unique data</strong> — Google search, Bloomberg terminal. Data competitors cannot easily acquire.</li>
          <li><strong>Regulatory / licensing</strong> — banking, utilities, healthcare. Permission is the moat.</li>
          <li><strong>Cost advantage at scale</strong> — Costco, Amazon. You produce cheaper than anyone can.</li>
          <li><strong>Exclusive relationships / contracts</strong> — aerospace supply chains, distribution lock-ups.</li>
        </ul>
        <p>
          <strong>"First mover advantage" is usually not a real moat.</strong> Friendster lost to MySpace.
          MySpace lost to Facebook. Yahoo lost to Google. Being first is only valuable if it
          lets you build one of the real moats above — typically network effects or data.
        </p>
      </>
    ),
  },
  {
    id: 'vanity-value',
    title: 'Vanity Metrics vs Value Metrics',
    blurb: 'Revenue is ego. Profit is sanity. Cash is king.',
    tags: ['mental-model', 'metrics'],
    body: (
      <>
        <div className="grid md:grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Vanity metrics</div>
            <ul>
              <li>Total revenue</li>
              <li>Total bookings</li>
              <li>Followers</li>
              <li>Signups</li>
              <li>Website traffic</li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Value metrics</div>
            <ul>
              <li>Contribution margin</li>
              <li>Profit</li>
              <li>Free cash flow</li>
              <li>LTV / CAC ratio</li>
              <li>Retention / churn</li>
            </ul>
          </div>
        </div>
        <p>
          Vanity metrics feel good and lie. "We hit £50k revenue this month!" means nothing
          if variable costs ate £48k of it. Value metrics feel boring — until you realize
          they are the only ones that tell the truth about whether the business works.
        </p>
      </>
    ),
  },
  {
    id: 'margin-safety',
    title: 'The Margin of Safety Rule (40% / 30%)',
    blurb: 'Cut revenue 40%, raise costs 30%. If the business dies, it is too fragile.',
    tags: ['framework', 'stress-test'],
    body: (
      <>
        <p>
          Before risking real money, put the model through the skeptical investor test:
        </p>
        <ul>
          <li>Cut revenue by <strong>40%</strong> (customers buy less, price drops, a channel fails).</li>
          <li>Raise costs by <strong>30%</strong> (rent up, inputs up, wages up).</li>
        </ul>
        <p>
          If the business still makes money (or at least survives with its cash reserves),
          you have a <em>margin of safety</em>. If it dies, you have a fragile model that is
          one surprise away from failure.
        </p>
        <p>
          Actively try to kill your business on paper. If it dies on a spreadsheet, it will
          definitely die when real rent bills and real bad months arrive.
        </p>
      </>
    ),
  },
  {
    id: 'hard-truths',
    title: 'Hard Truths',
    blurb: 'Most failure is about the model, not execution. Pick the right game.',
    tags: ['mental-model'],
    body: (
      <ul>
        <li>Most businesses fail because of the model, not execution.</li>
        <li>Picking the right business is 80% of the outcome. You cannot out-work a bad model.</li>
        <li>Revenue is ego. Profit is sanity. Cash is king.</li>
        <li>If you can write software, you have massive leverage — use it. Don't go run a hotel.</li>
        <li>A business isn't good because it makes money once. It's good because it makes money <em>predictably</em>, with <em>margin</em>, and <em>defensibly</em>.</li>
        <li>Skepticism beats optimism. Optimism compounds into catastrophe; skepticism compounds into survival.</li>
      </ul>
    ),
  },
  {
    id: 'shortlet',
    title: 'Case Study — Why Rent-to-Rent Shortlet Is Structurally Difficult',
    blurb: 'A worked example of dissecting a business model. The people making money own the property.',
    tags: ['case-study', 'shortlet'],
    body: (
      <>
        <p>
          Rent-to-rent shortlet: you rent a property long-term and sublet it on Airbnb / booking
          platforms. On paper the spread looks attractive. On the model, it is structurally
          hard. Here is the dissection:
        </p>
        <ul>
          <li><strong>You own nothing.</strong> Landlords get any asset appreciation; you only capture cash flow.</li>
          <li><strong>Costs are fixed and rising.</strong> Rent, council tax, utilities — the meter runs every day whether or not guests come.</li>
          <li><strong>Revenue is variable and capped.</strong> Market rates limit your ceiling; seasonality punches holes in the floor.</li>
          <li><strong>Platforms take 15–20% off the top.</strong> Straight into your variable costs.</li>
          <li><strong>Damage risk is asymmetric.</strong> No upside from a great guest; huge downside from one bad one.</li>
          <li><strong>No pricing power.</strong> You are a price-taker: same street, same rooms, same photos, lowest price wins.</li>
          <li><strong>Regulatory risk.</strong> Councils increasingly restrict short-let nights; leaseholds prohibit them; neighbours complain.</li>
          <li><strong>Typical margin:</strong> 10–20% when everything goes perfectly, negative the moment anything doesn't.</li>
        </ul>
        <p>
          <strong>Lesson:</strong> the people who make real money in shortlets{' '}
          <em>own the property</em>. They capture asset appreciation, which does the real
          compounding. If you do not capture the asset, you are a low-margin middleman
          between a landlord and a platform — with most of the risk and little of the reward.
        </p>
        <p>
          Apply the same dissection to any business you consider. It is the whole point of
          this app.
        </p>
      </>
    ),
  },
  {
    id: 'reading',
    title: 'Recommended Reading',
    blurb: 'Three books. Read them before you commit real money.',
    tags: ['resources'],
    body: (
      <ul>
        <li>
          <strong>The E-Myth Revisited</strong> — Michael Gerber. Why technicians fail at
          running businesses, and how to think in systems.
        </li>
        <li>
          <strong>Zero to One</strong> — Peter Thiel. Why moats and monopolies are the only
          businesses that matter, long-term.
        </li>
        <li>
          <strong>Financial Intelligence for Entrepreneurs</strong> — Karen Berman. Fluency
          with the numbers, in plain language.
        </li>
      </ul>
    ),
  },
];

export function Library() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CARDS;
    return CARDS.filter((c) => {
      const hay = (c.title + ' ' + c.blurb + ' ' + c.tags.join(' ')).toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Learning Library</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The framework behind this app. Come back to it whenever you need a refresher.
        </p>
      </div>
      <div className="max-w-md">
        <TextInput value={query} onChange={setQuery} placeholder="Search cards…" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((c) => {
          const isOpen = open[c.id] ?? false;
          return (
            <Card key={c.id}>
              <button
                className="w-full text-left"
                onClick={() => setOpen({ ...open, [c.id]: !isOpen })}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-lg">{c.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{c.blurb}</p>
                  </div>
                  <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="prose-chat text-sm text-slate-700 dark:text-slate-300 mt-3 space-y-2">
                  {c.body}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-sm text-slate-500">No cards match "{query}".</div>
        )}
      </div>
    </div>
  );
}

function Tr({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 pr-4 font-medium">{label}</td>
      <td className="py-1">{value}</td>
    </tr>
  );
}
