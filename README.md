# GroupMatch MVP

A social matching app where groups of friends (2-4 people) match with other groups. When both groups like each other, a group chat opens.

Built as a technical assessment demonstrating product judgment, clean code structure, and ability to ship a focused MVP.

**Live Demo:** https://groupmatch-mvp.vercel.app/

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Firebase Auth + Firestore, Vercel

## What I Built

The core matching loop - the minimum slice that proves the concept works:

- **Authentication** - Email/password signup and login with Firebase Auth
- **Group Creation** - Create a group with name, bio, and photo URL
- **Browse Groups** - Card UI to like or pass on other groups
- **Match Detection** - When both groups like each other, a match is created
- **Chat** - Basic messaging interface for matched groups

## What I Left Out (Intentionally)

- **Real-time chat** - Firestore listeners add complexity. Polling/refresh demonstrates the feature works. Would add for production.
- **Swipe animations** - Like/pass buttons achieve the same mechanic. Swipe gestures are UI polish, not core logic.
- **Photo upload** - URL input proves the UI works. File upload is a solved problem, not worth demo time.
- **User mini-profiles** - Nice-to-have. Core loop works without showing individual members on cards.
- **Location filtering** - Important for real product, but not needed to prove the matching mechanic.
- **Notifications** - Production feature. Doesn't change core UX for this demo.

## What I'd Add Next (With More Time)

- Real-time chat with Firestore onSnapshot listeners
- Swipe gestures with animations
- Group members - invite flow, show member avatars on cards
- Better onboarding flow
- Unmatch/block for safety
- Location-based discovery with GeoFirestore

## Firestore Schema

```
users/{uid} - email, groupId
groups/{groupId} - name, bio, photoUrl, adminUserId, createdAt
likes/{likeId} - fromGroupId, toGroupId, createdAt
matches/{matchId} - groupIds array, createdAt
matches/{matchId}/messages/{messageId} - groupId (sender), text, createdAt
```

## Local Development

1. Install dependencies: `npm install`
2. Copy environment template: `cp .env.local.example .env.local`
3. Add your Firebase credentials to `.env.local`
4. Run dev server: `npm run dev`

**Time Spent:** ~3 hours
