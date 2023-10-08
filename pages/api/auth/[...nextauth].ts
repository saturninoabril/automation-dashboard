import NextAuth, { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { loadEnvConfig } from '@next/env';
import { Octokit } from '@octokit/rest';

const dev = process.env.NODE_ENV !== 'production';
const { GITHUB_ID, GITHUB_SECRET, GITHUB_PAT, GITHUB_ORG, GITHUB_ORG_TEAMS } = loadEnvConfig(
    './',
    dev
).combinedEnv;
const githubId = GITHUB_ID || '';
const githubSecret = GITHUB_SECRET || '';

export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: githubId,
            clientSecret: githubSecret,
        }),
    ],
    callbacks: {
        async jwt({ token, user, account, profile, trigger, session }) {
            // Persist the OAuth access_token and or the user id to the token right after signin
            console.log('token', token);
            console.log('user', user);
            console.log('account', account);
            console.log('profile', profile);
            console.log('trigger', trigger);
            console.log('session', session);
            if (token && account && profile) {
                token.accessToken = account.access_token;
                token.github = account.github;
                token.login = profile.login;
                token.name = profile.name;
                token.avatarUrl = profile.avatar_url;
                token.email = profile.email;

                // todo: add access role for staff - members of GH org
            }

            if (token) {
                const teams = GITHUB_ORG_TEAMS?.split(',').map((s) => s.trim());
                const octokit = new Octokit({ auth: GITHUB_PAT });

                const members: string[] = [];
                if (teams?.length) {
                    for (let i = 0; i < teams?.length; i++) {
                        const membersRes = await octokit.rest.teams.listMembersInOrg({
                            org: GITHUB_ORG || '',
                            team_slug: teams[i],
                            per_page: 100,
                        });
                        membersRes.data.forEach((member) => {
                            members.push(member.login);
                        });
                    }
                }
                console.log(members, 'member', members.length);

                const isMember = members.includes(token.login);
                console.log('isMember', isMember);

                // todo: add access role for staff - members of GH org
            }

            return token;
        },
    },
};

export default NextAuth(authOptions);
