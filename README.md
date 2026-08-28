# CoachFlow - Personal Trainer Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.9.1-indigo?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## Overview

Modern SaaS platform for personal trainers to manage their entire client lifecycle - from invite-based onboarding and comprehensive fitness assessments to nutrition planning, training program delivery, and progress tracking.

## Features by Role

### Trainer
- Invite-link client onboarding
- Fitness assessment engine with auto BMI/BMR/TDEE
- Nutrition templates & plans
- Training split templates
- Progress analytics
- Subscriptions & sessions management

### Admin
- Global dashboard
- Trainer management
- All clients & subscriptions views

### Client
- Public invite form
- Baseline assessment

## Tech Stack
Next.js 16, React 19.2, TypeScript 5, NextAuth.js 4, Prisma 7.9.1, PostgreSQL, Tailwind CSS 4, shadcn/ui

## Quick Start
```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

## License
MIT
