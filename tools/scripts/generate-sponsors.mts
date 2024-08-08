import fetch from 'cross-fetch';
import * as fs from 'fs';
import * as path from 'path';

import { PACKAGES_WEBSITE } from './paths.mts';

type MemberNodes = {
  account: {
    id: string;
    imageUrl: string;
    name: string;
    website: string;
  };
  totalDonations: { valueInCents: number };
}[];

const excludedNames = new Set([
  'Josh Goldberg', // Team member 💖
]);

const filteredTerms = ['casino', 'deepnude', 'tiktok'];

const { members } = (
  (await (
    await fetch('https://api.opencollective.com/graphql/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          {
            collective(slug: "typescript-eslint") {
              members(limit: 1000, role: BACKER) {
                nodes {
                  account {
                    id
                    imageUrl
                    name
                    website
                  }
                  tier {
                    amount {
                      valueInCents
                    }
                    orders(limit: 100) {
                      nodes {
                        amount {
                          valueInCents
                        }
                      }
                    }
                  }
                  totalDonations {
                    valueInCents
                  }
                  updatedAt
                }
              }
            }
          }
        `,
      }),
    })
  ).json()) as { data: { collective: { members: { nodes: MemberNodes } } } }
).data.collective;

const sponsors = (
  Object.entries(
    Object.groupBy(members.nodes, ({ account }) => account.name || account.id),
  ) as [string, MemberNodes][]
)
  .map(([id, members]) => {
    const [{ account }] = members;
    return {
      id,
      image: account.imageUrl,
      name: account.name,
      totalDonations: members.reduce(
        (sum, { totalDonations }) => sum + totalDonations.valueInCents,
        0,
      ),
      website: account.website,
    };
  })
  .filter(
    ({ id, name, totalDonations, website }) =>
      !(
        filteredTerms.some(filteredTerm =>
          name.toLowerCase().includes(filteredTerm),
        ) ||
        excludedNames.has(id) ||
        totalDonations < 10000 ||
        !website
      ),
  )
  .sort((a, b) => b.totalDonations - a.totalDonations);

fs.writeFileSync(
  path.join(PACKAGES_WEBSITE, 'data', 'sponsors.json'),
  `${JSON.stringify(sponsors, null, 2)}\n`,
);
