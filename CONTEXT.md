# story_time

A children's story reading app for kids aged 6–10, delivering bundled static stories across iOS and Android.

## Language

**Story**:
A self-contained narrative unit with a title, cover art, reading time, and a variable number of pages.
_Avoid_: Book, tale, content

**Page**:
A single unit within a Story, containing text and an optional illustration.
_Avoid_: Slide, screen, chapter

**Illustration**:
An optional image asset attached to a Page.
_Avoid_: Image, picture, photo

**Cover Art**:
A dedicated image asset representing a Story in the Library. Distinct from page illustrations.
_Avoid_: Cover image, thumbnail, cover illustration

**Reading Time**:
A manually provided estimate of how long a Story takes to read, expressed as "X min".
_Avoid_: Read time, duration, estimated time

**Library**:
The home screen displaying all Stories as a grid of Story Cards.
_Avoid_: Home, story list, browse screen

**Story Card**:
The visual tile representing a Story in the Library, showing its Cover Art, title, and Reading Time.
_Avoid_: Card, tile, list item

**Reader**:
The screen where a kid reads a Story, navigating between Pages by swiping.
_Avoid_: Story view, reading screen, viewer

## Relationships

- A **Story** contains one or more **Pages**
- A **Page** contains text and an optional **Illustration**
- A **Story** has exactly one **Cover Art** (separate from any page **Illustrations**)
- A **Story Card** represents one **Story** in the **Library**
- Tapping a **Story Card** opens the **Reader** for that **Story**

## Example dialogue

> **Dev:** "Should I reuse the first **Page**'s **Illustration** as the **Cover Art**?"
> **Domain expert:** "No — **Cover Art** is a separate asset provided per **Story**. It's composed specifically for the **Story Card** thumbnail, not pulled from the **Reader**."

> **Dev:** "Can a **Page** have only an **Illustration** and no text?"
> **Domain expert:** "No — every **Page** must have text. An **Illustration** is optional."
