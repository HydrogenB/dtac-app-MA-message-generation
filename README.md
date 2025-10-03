# MA Message Generator - Static HTML Version

Complete standalone version of the Maintenance Announcement Generator with full visual time grid selector.

## 📁 Files

- `index.html` - Main HTML structure
- `styles.css` - Complete styling with responsive design
- `time-grid.js` - Visual 48-hour time grid component
- `app.js` - Message generation logic

## ✨ Features

### Complete Feature Parity with React App:

✅ **Visual Time Grid Selector (48-hour view)**
- Drag-to-select time ranges
- Draggable start/end handles
- Color-coded time periods
- Centered on midnight boundary
- Smooth scrolling

✅ **Quick Action Buttons**
- Business Hours (9am-5pm)
- Overnight (10pm-6am)
- All 48 Hours
- Clear Selection

✅ **Date Selection**
- Calendar picker with min date validation
- Two-day header display

✅ **Interval Options**
- 15 minutes
- 30 minutes (default)
- 60 minutes

✅ **Message Output**
- Pre-MA Announcements (TH & EN)
- MA Mode Messages (TH & EN)
- Individual copy buttons
- Copy All with formatted headers

✅ **Thai & English Formatting**
- Thai Buddhist Era (BE) dates
- English Gregorian dates
- Cross-day detection
- Proper "ของวันถัดไป" / "of the following day" suffix

## 🚀 Deployment Options

### Option 1: GitHub Pages (Recommended)

1. **Create new repository:**
```bash
git init
git add .
git commit -m "Add MA Message Generator"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ma-message-generator.git
git push -u origin main
```

2. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / root
   - Save

3. **Access at:** `https://YOUR-USERNAME.github.io/ma-message-generator/`

### Option 2: Netlify Drop

1. Zip the `htmlstatic` folder
2. Go to https://app.netlify.com/drop
3. Drag and drop the zip file
4. Get instant URL

### Option 3: Vercel

```bash
npm i -g vercel
cd htmlstatic
vercel
```

### Option 4: Local Testing

Simply open `index.html` in any modern browser. All features work offline!

## 🎯 How to Use

1. **Select Date**: Choose maintenance date from calendar
2. **Choose Interval**: 15, 30, or 60 minute slots
3. **Select Time Range**:
   - Click and drag across time grid
   - Or use Quick Action buttons
   - Or drag start/end handles to adjust
4. **View Messages**: Auto-generated in all 4 formats
5. **Copy**: Individual messages or all at once

## 🎨 Time Grid UI

The 48-hour time grid shows:
- **Blue tint**: Early morning (00:00-06:00) & Night (22:00-00:00)
- **Yellow tint**: Morning (06:00-12:00)
- **Orange tint**: Afternoon (12:00-18:00)
- **Purple tint**: Evening (18:00-22:00)
- **Red line**: Midnight boundary
- **Blue overlay**: Selected time range

## 📋 Message Format

Copy All generates this format:

```
Pre-MA Announcement
TH:  เรียนลูกค้าที่เคารพ ดีแทคแอปจะปิดปรับปรุง...
EN (also for MY/KM):  Dear customers, please note...

MA Mode (during maintenance)
TH: ขณะนี้ dtac app กำลังปิดปรับปรุง...
EN (also for MY/KM): dtac app is now upgrading...
```

## 🔧 Customization

All code is organized and commented:
- **colors/gradients**: `styles.css` (lines 15-35)
- **message templates**: `app.js` (lines 120-140)
- **time grid behavior**: `time-grid.js`

## 📱 Browser Support

Works on all modern browsers:
- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

## 🆘 Troubleshooting

**Grid not centering:**
- Check browser console for errors
- Ensure all JS files are loaded

**Copy not working:**
- HTTPS required for clipboard API
- Works on localhost with HTTP

**Styling issues:**
- Clear browser cache
- Check CSS file is loaded

## 📄 License

Free to use and modify for your organization.

## 🔄 Updates from React Version

This static version includes ALL features from the React app:
- Exact same visual time grid
- Same drag-and-drop interactions
- Same message formatting
- Same UI/UX design
- Zero build process required
