# API Endpoints

## Health Check
- **GET** `/public/ping`

## Authentication (Public)
- **POST** `/public/auth/forgot_password`
- **POST** `/public/auth/reset_password`
- **GET** `/public/auth/check_token`
- **GET** `/public/auth/login`
- **POST** `/public/auth/login/password`
- **POST** `/public/auth/login/token`
- **POST** `/public/auth/login/oauth/token`
- **POST** `/public/auth/login/oauth/refresh_token`

## Protected API Endpoints (Require Authentication)

## Chaperones
- **GET** `/api/chaperones`
- **PUT** `/api/chaperones`
- **PATCH** `/api/chaperones/:chaperone_id`
- **DELETE** `/api/chaperones/:chaperone_id`

## Chaperone Availability
- **GET** `/api/chaperones/availability`
- **GET** `/api/chaperones/availability/:chaperone_id`
- **PATCH** `/api/chaperones/availability/:chaperone_id`
- **POST** `/api/chaperones/availability/email`

## Events
- **GET** `/api/events`
- **PUT** `/api/events`
- **GET** `/api/events/:event_id`
- **PATCH** `/api/events/:event_id`
- **DELETE** `/api/events/:event_id`
- **POST** `/api/events/create_term`

## Chaperone Slots
- **GET** `/api/chaperone_slots`
- **PUT** `/api/chaperone_slots`
- **PATCH** `/api/chaperone_slots/:slot_id`
- **DELETE** `/api/chaperone_slots/:slot_id`
- **GET** `/api/chaperone_slots/event/:event_id`
- **DELETE** `/api/chaperone_slots/event/:event_id`
- **GET** `/api/chaperone_slots/chaperone/:chaperone_id`

## Templates
- **GET** `/api/templates`
- **PUT** `/api/templates`
- **PATCH** `/api/templates/:template_id`
- **DELETE** `/api/templates/:template_id`

## Template Chaperone Slots
- **GET** `/api/template_chaperone_slots`
- **PUT** `/api/template_chaperone_slots`
- **GET** `/api/template_chaperone_slots/:template_slot_id`
- **PATCH** `/api/template_chaperone_slots/:template_slot_id`
- **DELETE** `/api/template_chaperone_slots/:template_slot_id`

## Notifications
- **POST** `/api/notifications/subscribe`

## Chaperone Events
- **POST** `/api/chaperones/events/email`
