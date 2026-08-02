I checked [NovelApp](https://novel-app2.vercel.app/). Considering that it is still in development, this is a strong MVP foundation. It already feels like an actual reading platform rather than a collection of disconnected pages.

## Current score

| Area                             |       Score |
| -------------------------------- | ----------: |
| Visual presentation              |        8/10 |
| Homepage structure               |      7.5/10 |
| Content discovery                |        7/10 |
| Reader experience                |      6.5/10 |
| Writer experience                |      6.5/10 |
| Content quality/control          |      4.5/10 |
| Branding                         |        6/10 |
| Technical foundation             |      7.5/10 |
| Mobile/responsive planning       |      7.5/10 |
| Current development score    |  68/100 |
| Potential after improvements | 85/100+ |

## What is already good

### 1. It has a real product structure

The application already contains:

* Homepage
* Categories
* Blog
* Search
* Sign-up and login
* Novel pages
* Writing entry point
* Rankings
* Genre-specific sections
* Responsive navigation
* Loading skeletons
* Light and dark-theme support

The main routes I checked returned successfully.

### 2. The hero communicates the product quickly

“Read Endless Worlds” establishes that this is a fiction platform. The two primary actions—reading and writing—also make the two audiences obvious.

### 3. Category discovery is visually strong

The genre cards are attractive and easy to scan. Horizontal scrolling is particularly suitable for mobile.

### 4. Novel cards are well constructed

The cards contain:

* Cover image
* Genre
* Title
* Author
* Description preview
* Hover feedback

The image ratios are also consistent, which helps the page look organised.

### 5. The responsive decisions are sensible

The desktop navigation has search, while smaller screens receive a mobile-friendly search placement. Buttons become full-width where necessary, and the novel grid adjusts across screen sizes.

---

# Most important problems

## 1. Test content is visible publicly

The most noticeable problem is the presence of unfinished records such as:

* hhas
* ahsha
* A username containing what appears to be a phone number
* Extremely short descriptions
* Books placed under incorrect genre sections

This makes the platform feel less trustworthy, even though the interface itself is polished.

Before showing the app to recruiters or public users:

* Seed it with 8–12 realistic demo novels.
* Use complete titles and descriptions.
* Add believable author profiles.
* Ensure each novel has the correct genre.
* Remove personal information from usernames.
* Hide drafts and incomplete records from public listings.

This is the highest-priority improvement.

## 2. Genre filtering appears inconsistent

Examples include novels labelled Fantasy appearing inside Romance or Action sections.

This could mean:

* The homepage query is not filtering by genre correctly.
* The genre stored in the database is incorrect.
* Sections are using fallback records when insufficient books exist.
* One book can have several genres, but the UI shows only one of them.

If multiple genres are supported, display all relevant tags. Otherwise, fix the query:

Romance section → only published novels containing Romance
Action section → only published novels containing Action
Do not fill empty genre sections with unrelated books. Hide the section until it has valid content.

## 3. Content maturity and moderation need attention

One publicly displayed synopsis contains mature and coercive themes, but the homepage shows no content warning or maturity classification.

A public fiction platform should eventually support:

* Age/maturity ratings
* Content warnings
* Reporting
* Blocking
* Author guidelines
* Draft review or automated moderation
* Admin removal tools
* A distinction between general and mature content
* Safe default recommendations for younger readers
Even during development, placeholder content should be carefully selected because it defines the product’s public image.

## 4. Branding is too generic

“NovelApp” clearly communicates the purpose, but it sounds like a temporary project name. It will be difficult to distinguish in search results or remember after one visit.

A stronger name should be:

* Short
* Searchable
* Easy to pronounce
* Relevant to stories or reading
* Available as a domain and social handle

The current book icon is also functional but generic. A distinct wordmark and primary brand colour would make the product more recognisable.

## 5. The homepage needs stronger prioritisation

The homepage contains many categories and novel sections. As the catalogue grows, the page could become too long and repetitive.

A cleaner order would be:

1. Hero
2. Continue Reading—for returning users
3. Featured or Editor’s Picks
4. Trending This Week
5. Categories
6. New Releases
7. Personalised recommendations
8. CTA for writers
9. Footer

Avoid displaying a separate section for every genre on the homepage. Categories already handle genre exploration.

## 6. Rankings require transparent logic

The numbered ranking section is useful, but users need to understand what the ranking means.

Possible labels:

* Most Read This Week
* Trending Today
* Most Followed
* Highest Rated
* Fastest Growing

Define the calculation so one old novel cannot remain permanently first. For example, trending could consider recent:

* Unique readers
* Chapter completions
* Library additions
* Ratings
* Comments

Protect the ranking against repeated self-views and artificial engagement.

---

# Reader-experience improvements

## Novel detail page

Every novel page should clearly show:

* Cover
* Title and author
* Description
* Genre
* Maturity rating
* Completion status
* Chapter count
* Last updated date
* Total reads
* Rating
* “Start Reading” or “Continue Reading”
* “Add to Library”
* Chapter list
* Related novels

The primary action should remain visible without forcing the reader to search for it.

## Reading page

The actual reader is the most important screen in the entire product. It should support:

* Adjustable font size
* Line-height control
* Light, sepia and dark reading themes
* Reading-width control
* Previous and next chapter
* Reading-progress indicator
* Automatic progress saving
* Chapter navigation
* Report-content action
* Distraction-free mode

Do not overload the reading screen with navigation or recommendations.

## Personal library

Readers should have states such as:

* Currently Reading
* Want to Read
* Completed
* Following
* Reading History

A reader should be able to resume at the exact paragraph or chapter they previously reached.

## Search

Search should eventually support:

* Title
* Author
* Genre
* Tags
* Completed/ongoing status
* Recently updated
* Popularity
* Rating

Add an empty state such as:

> No matching novels found. Try another title, author or genre.

---

# Writer-experience improvements

## Writing dashboard

The author dashboard should provide:

* Novel drafts
* Published novels
* Chapter drafts
* Scheduled chapters
* Total readers
* Chapter completion rate
* Comments and feedback
* Follower growth
* Last edited date

## Editor requirements

The editor should include:

* Automatic saving
* Visible “Saved” status
* Word count
* Chapter title
* Draft/published status
* Preview
* Version history
* Scheduled publishing
* Recovery after network failure
* Confirmation before leaving with unsaved changes

Autosave should be reliable. Writers will lose trust immediately if their work disappears.

## Publishing flow

Use a deliberate flow:

Create novel
→ Add title, description and cover
→ Select genres and maturity rating
→ Create chapters
→ Preview
→ Publish
Drafts must never appear publicly until explicitly published.

---

# Trust and platform requirements

Before a public launch, add:
* Terms of Service
* Privacy Policy
* Community Guidelines
* Copyright/reporting process
* Content-reporting system
* Account deletion
* Data export
* Author ownership explanation
* Contact/support page
* Moderation dashboard

For uploaded covers, validate:

* File type
* File size
* Dimensions
* Ownership or usage rights
* Unsafe or prohibited material

If comments are introduced, include spam protection, rate limiting, reporting and moderation from the beginning.

---

# Technical observations

## SEO metadata inconsistency

The application’s metadata currently identifies the site URL as:

> https://novelapp.com

But the active deployment uses the Vercel URL.

Until a real domain is connected, use the actual active URL for:

* Canonical URL
* Open Graph URL
* Sitemap
* Robots configuration
* Structured data

Also add an Open Graph image so links look professional when shared.

## Images

External cover images are served from Supabase, while the hero uses an external Unsplash URL.

Recommended improvements:

* Optimise uploaded covers.
* Generate multiple image sizes.
* Use lazy loading below the fold.
* Provide fallback covers.
* Prevent layout shifts.
* Validate remote image domains.
* Avoid loading every category image immediately if it is below the fold.

## Loading strategy

The homepage uses skeleton loading, which is good. However, skeletons should closely match the final layout and not remain visible for too long.

Also add explicit:

* Error states
* Empty states
* Retry controls
* Offline/network-failure messages

## Data model

A flexible novel model could contain:

Novel
- id
- authorId
- title
- slug
- synopsis
- coverKey
- status
- maturityRating
- language
- publishedAt
- updatedAt

Genre
- id
- name
- slug

NovelGenre
- novelId
- genreId

Chapter
- id
- novelId
- title
- position
- content
- status
- publishedAt
A junction table allows one novel to have several genres without incorrectly duplicating it.

---

# Recommended development priority

## Phase 1 — Make the demo credible

1. Remove test and low-quality content.
2. Correct category filtering.
3. Add realistic seed novels.
4. Fix public usernames containing personal information.
5. Clarify ranking labels.
6. Correct the metadata URL.
7. Add a proper footer.

## Phase 2 — Complete the core loop

1. Improve novel detail pages.
2. Complete the chapter reader.
3. Add reading-progress persistence.
4. Complete the writing editor.
5. Add drafts and autosave.
6. Add personal libraries.
7. Improve search and filtering.

## Phase 3 — Safety and trust

1. Maturity ratings
2. Content warnings
3. Reporting
4. Moderation dashboard
5. Community guidelines
6. Privacy and terms
7. Copyright process

## Phase 4 — Growth features

1. Ratings and reviews
2. Comments
3. Author following
4. Personalised recommendations
5. Notifications
6. Writer analytics
7. Weekly trending lists

## Final verdict

This is a good in-development project. The interface is already ahead of the content and data quality—which is actually a fixable position.

The immediate goal should not be adding more visual effects. It should be making the existing product trustworthy:

* Clean data
* Correct categorisation
* Strong reader flow
* Reliable writing flow
* Content moderation
* Consistent branding

Once those foundations are handled, NovelApp could become both a strong portfolio project and a genuinely usable fiction platform.