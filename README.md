# QPR Team Site - Queens Park Rangers U11B

A lightweight, privacy-respecting website for Coquitlam Metro-Ford4. **Weekly updates:**
   - Add new `.md` files to `/src/content/news/`Rangers U11 Boys soccer team. Built with Astro for speed and simplicity, designed for easy weekly updates by non-developer coaches.

## ✨ Features

- **Privacy-first**: Only first names, no photos without approval, no personal information
- **Easy updates**: Add new posts by creating markdown files
- **Mobile responsive**: Works great on all devices
- **Print-friendly**: Training plans and schedules optimized for printing
- **Fast & lightweight**: Built with Astro, minimal JavaScript
- **Accessible**: Semantic HTML, keyboard navigation, screen reader friendly

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Git
- GitHub account

### Local Development

1. **Clone and install:**
   ```bash
   git clone <your-repo-url>
   cd qpr-team-site
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:4321`

3. **Build for production:**
   ```bash
   npm run build
   npm run preview
   ```

## 📚 Adding New Content

### Adding a News Post

1. Create a new file in `/src/content/news/` with this naming pattern:
   ```
   YYYY-MM-DD-descriptive-title.md
   ```

2. Use this front-matter template:
   ```markdown
   ---
   title: "Your Post Title"
   date: 2025-08-26
   tags: ["practice", "kits", "games"]
   summary: "One-sentence summary for the home page and news listing."
   ---
   
   Your post content here in Markdown...
   ```

3. Save the file and the post will automatically appear on:
   - Home page (if it's the latest post)
   - News page
   - Individual post page at `/news/your-title`

### Updating Team Information

- **Roster**: Edit `/data/roster.json`
- **Practice times**: Edit `/data/config.json`
- **Coach info**: Edit `/src/pages/about.astro`
- **Kit pickup details**: Edit `/src/pages/kits.astro`

## 🌐 Deployment to GitHub Pages

### Initial Setup

1. **Create GitHub repository:**
   - Go to GitHub.com and create a new repository
   - Name it `qpr-team-site` (or your preferred name)
   - Make it public

2. **Update configuration:**
   Edit `astro.config.mjs` and replace:
   ```javascript
   site: 'https://USERNAME.github.io',
   base: '/qpr-team-site',
   ```
   With your actual GitHub username and repository name.

3. **Push your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/qpr-team-site.git
   git push -u origin main
   ```

4. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click Settings → Pages
   - Under "Source", select "GitHub Actions"
   - The site will build automatically and be available at:
     `https://USERNAME.github.io/qpr-team-site`

### Weekly Updates

To add new posts or update content:

1. **Edit files directly on GitHub:**
   - Go to your repository
   - Navigate to `/src/content/news/`
   - Click "Add file" → "Create new file"
   - Name it `2025-MM-DD-your-title.md`
   - Add your content with proper front-matter
   - Click "Commit changes"

2. **Or clone, edit locally, and push:**
   ```bash
   git pull origin main
   # Edit files...
   git add .
   git commit -m "Add weekly update"
   git push origin main
   ```

The site will automatically rebuild and deploy within 2-3 minutes.

## 📁 File Structure

```
qpr-team-site/
├── .github/workflows/deploy.yml    # Automatic deployment
├── src/
│   ├── components/                 # Reusable components
│   ├── layouts/                    # Page templates
│   ├── pages/                      # Site pages
│   └── styles/globals.css          # All styling
├── src/content/news/                # Blog posts (markdown)
├── data/                          # Team data (JSON)
├── public/                        # Static files
└── package.json                   # Dependencies
```

## 🎨 Customization

### Colors & Styling
Edit CSS variables in `/src/styles/globals.css`:
```css
:root {
  --color-primary: #2563eb;      /* Main blue */
  --color-accent: #f59e0b;       /* Accent color */
  /* ... more variables */
}
```

### Team Information
- **Team name**: Update in multiple pages (search for "Queens Park Rangers")
- **Coach name**: Edit `/src/pages/about.astro`
- **Practice details**: Edit `/data/config.json`
- **Contact info**: Provided privately to parents, not on public site

## 📱 Content Guidelines

### Writing Posts
- Keep tone friendly and concise
- Use bullet points for easy scanning
- Include key details: dates, times, locations
- Add relevant tags for organization

### Privacy & Safety
- **Never include**: last names, birth dates, addresses, phone numbers
- **Photos**: Only with parent permission, faces blurred or obscured
- **Contact info**: Share privately with parents, not on public site

### SEO & Accessibility
- Use descriptive headings (H1, H2, H3)
- Include alt text for any images
- Keep paragraphs short for mobile reading

## 🔧 Maintenance

### Season Rollover
At the end of each season:

1. **Archive old posts:**
   ```bash
   mkdir src/content/archive/2025-26
   mv src/content/news/* src/content/archive/2025-26/
   ```

2. **Update team data:**
   - Edit `/data/roster.json` with new players
   - Update season year throughout site
   - Refresh coach information if needed

3. **Reset for new season:**
   - Add first post welcoming new season
   - Update practice schedules and game information

### Troubleshooting

**Site not updating after push:**
- Check GitHub Actions tab for build errors
- Ensure all markdown files have proper front-matter
- Verify astro.config.mjs has correct URLs

**Markdown not rendering:**
- Check front-matter syntax (YAML format)
- Ensure file is in `/src/content/news/` directory
- Verify date format: `YYYY-MM-DD`

**Styling issues:**
- CSS is in a single file: `/src/styles/globals.css`
- Use browser dev tools to debug
- Test on mobile devices

## 📞 Support

For technical issues:
- Check GitHub Issues for common problems
- Review Astro documentation: https://docs.astro.build
- Verify all file paths and syntax

For content questions:
- Review existing posts for examples
- Check markdown syntax guides
- Keep posts simple and focused

## 🏆 Season Management Tips

### Weekly Routine
1. **Monday**: Plan week's post content
2. **Tuesday**: Write and publish weekly update
3. **Thursday**: Post practice recap if noteworthy
4. **Saturday**: Game day updates (results, highlights)

### Content Ideas
- Practice reminders and weather updates
- Game schedules and results
- Kit and equipment reminders
- Training focus and player development
- Team achievements and player spotlights (first names only)
- Parent information and volunteer opportunities

## 📄 License

This website template is open source and free to use for youth soccer teams. Modify as needed for your team's requirements.

---

**Built for Queens Park Rangers U11B - Season 2025-2026**  
*Coquitlam Metro-Ford SC*
