# White Label Configuration Guide

## Overview

LilySEO's white label feature allows Pro and Enterprise subscribers to customize the platform with their own branding. This guide will walk you through the process of configuring white label settings to create a seamless branded experience for your clients.

## Prerequisites

- An active Pro or Enterprise subscription
- Your company logo (recommended size: 200x100px, formats: PNG, JPG, SVG)
- Your brand colors (in hex or HSL format)
- Custom domain (optional)

## Accessing White Label Settings

1. Log in to your LilySEO dashboard
2. Click on the "White Label" option in the sidebar navigation
3. If you don't have an active Pro or Enterprise subscription, you'll see an upgrade prompt

## Configuration Options

### Enabling White Label Features

At the top of the white label settings page, you'll find a toggle to enable or disable white label features. When enabled, all your customizations will be applied to the platform.

### Branding

#### Company Name

Enter your company or agency name. This will replace "LilySEO" throughout the platform.

#### Logo

Upload your company logo by clicking the "Upload Logo" button. For best results:
- Use a transparent PNG or SVG file
- Keep the file size under 1MB
- Use a logo with a height-to-width ratio of approximately 1:2

After uploading, you can preview how your logo will appear in the platform. If you need to replace the logo, simply upload a new one or click "Remove" to delete the current logo.

#### Logo Alt Text

Enter alternative text for your logo to ensure accessibility for users with screen readers.

### Appearance

#### Colors

Customize the primary and secondary colors used throughout the platform:

- **Primary Color**: Used for buttons, links, and highlighted elements. Enter a hex code (e.g., #FF5500) or HSL value (e.g., hsl(220 70% 50%)).
- **Secondary Color**: Used for backgrounds and secondary elements. Enter a hex code or HSL value.

As you change these colors, you can use the "Preview Changes" button to see how they will look in the platform.

#### Custom Domain

Enter your custom domain to serve the white-labeled platform (e.g., seo.yourcompany.com).

**Important**: After entering your custom domain, you'll need to set up DNS records to point to our servers. Contact our support team for detailed instructions specific to your domain registrar.

### Customization

#### Custom Footer

Customize the copyright text that appears in the footer of the platform. You can use the following variables:
- `{year}`: Current year
- `{company}`: Your company name

Example: `© {year} {company}. All rights reserved.`

#### Custom CSS & JavaScript

Advanced users can add custom CSS and JavaScript to further customize the appearance and functionality of the platform.

**Custom CSS**: Add CSS rules to override default styles. For example:
```css
.dashboard-header {
  background-color: #f5f5f5;
}

.report-card {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**Custom JavaScript**: Add JavaScript code to extend functionality. For example:
```javascript
document.addEventListener('DOMContentLoaded', function() {
  console.log('Custom script loaded');
  // Your custom code here
});
```

**Note**: Custom JavaScript is executed after the page loads. Be careful not to interfere with core platform functionality.

## Preview Mode

Use the "Preview Changes" button at the top of the settings page to see how your white label customizations will look without saving them. This allows you to experiment with different settings before applying them.

The preview includes:
- Header with your logo and company name
- Navigation with your primary color
- Sample dashboard content
- Footer with your custom copyright text

## Saving Changes

After configuring your white label settings, click the "Save Settings" button at the bottom of the page. Your changes will be applied immediately.

## Best Practices

1. **Maintain Brand Consistency**: Use colors and fonts that match your existing brand guidelines.
2. **Test on Multiple Devices**: Ensure your branding looks good on desktop, tablet, and mobile devices.
3. **Keep File Sizes Small**: Optimize your logo and any custom assets for web to ensure fast loading times.
4. **Use Preview Mode**: Always preview your changes before saving to ensure they look as expected.
5. **Be Careful with Custom Code**: Test any custom CSS or JavaScript thoroughly to avoid breaking functionality.

## Troubleshooting

### Logo Not Displaying Correctly
- Ensure your logo is in a supported format (PNG, JPG, SVG)
- Check that the file size is under 1MB
- Try using a logo with a transparent background

### Custom Domain Not Working
- Verify that your DNS records are set up correctly
- Allow 24-48 hours for DNS changes to propagate
- Contact support if issues persist

### Colors Not Applying
- Ensure you're using valid hex codes (e.g., #FF5500) or HSL values (e.g., hsl(220 70% 50%))
- Try clearing your browser cache
- Check if custom CSS might be overriding your color settings

## Support

If you encounter any issues with white label configuration, please contact our support team at support@lilyseo.com or use the in-app chat support.

## FAQ

**Q: Can I use different branding for different clients?**
A: Currently, white label settings apply to your entire account. For multiple client brands, you would need separate LilySEO accounts.

**Q: Will my clients know they're using LilySEO?**
A: When white label features are enabled, all LilySEO branding is replaced with your own. Your clients will see only your brand.

**Q: Can I customize email notifications?**
A: Yes, email notifications sent to your clients will use your company name and logo.

**Q: Is white labeling available on all plans?**
A: White label features are available exclusively for Pro and Enterprise subscribers.

**Q: Can I customize the URL structure?**
A: Yes, with a custom domain. You can set up a domain like seo.yourcompany.com to serve the white-labeled platform.

**Q: Will updates to LilySEO affect my white label settings?**
A: No, your white label settings will be preserved through platform updates. 