/* ==========================================================================
   OCYM Kollam Diocese - Global Configuration Settings
   ========================================================================== */

/**
 * REGISTRATION TOGGLE CONFIGURATION
 * --------------------------------------------------------------------------
 * Set SHOW_REGISTRATION to true during Kalamela registration season.
 * When true:
 *  - Registration item appears automatically in Header Navigation.
 *  - Registration CTA buttons appear in Hero & Quick Access sections.
 *  - Kalamela Registration form becomes active on registration.html.
 *
 * Change this ONE boolean value below to toggle the entire feature.
 */
window.SHOW_REGISTRATION = true;

/**
 * HOMEPAGE IMAGE SLIDER API ENDPOINT
 * --------------------------------------------------------------------------
 * The Google Sheet contains: Image URL | Event Title | Description / Caption
 */
window.SLIDER_API_URL = "https://script.google.com/macros/s/AKfycbzCwEngUV4q6tQMkYq4fNg1ugV20c1evz7Z-m9JHODkMh3k-0ejwHkIApHnpGlZ4CSq/exec";

/**
 * GALLERY API ENDPOINT
 * --------------------------------------------------------------------------
 * The Google Apps Script returns: [{ "title": "...", "date": "...", "photos": [{ "name": "...", "url": "..." }] }]
 */
window.GALLERY_API_URL = "https://script.google.com/macros/s/AKfycby6kskI1i9Kl9O-Ftk_qq3cgtEa3sBGKzwi7_di_1DFF2BGyde6rJ9MUX9ldH2BvWU-Og/exec";

/**
 * REGISTRATION FORM ENDPOINT (Google Apps Script web app)
 * --------------------------------------------------------------------------
 * Used by registration.js (submit) and sakshyapatram.js (file upload).
 */
window.REGISTRATION_POST_URL = "https://script.google.com/macros/s/AKfycbyf_DQeEJaUM2AeAzjmFPY3alip-nYTTwGq4gGI4BfUpmDW_IcYTt5Qxkcna-pFrSI7/exec";

/**
 * VICAR'S SAKSHYAPATRAM UPLOAD - REQUIRED SWITCH
 * --------------------------------------------------------------------------
 * true  = the form cannot be submitted without the file.
 * false = the file is optional (emergency switch).
 * MUST equal SAKSHYA_REQUIRED in the Apps Script (Code.gs). Change both, then
 * deploy a new Apps Script version and upload this file.
 */
window.SAKSHYA_REQUIRED = true;
