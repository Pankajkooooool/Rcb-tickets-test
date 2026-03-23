const { chromium } = require('playwright');
const fs = require('fs');
const { execSync } = require('child_process');

// Cross-platform beep function
function beep() {
    try {
        if (process.platform === 'win32') {
            // Windows: use PowerShell to play system beep
            execSync('powershell -c "[console]::beep()"', { stdio: 'ignore' });
        } else {
            // macOS/Linux: use the beep command or bell character
            process.stdout.write('\x07');
        }
    } catch (error) {
        // Fallback: use bell character if system command fails
        process.stdout.write('\x07');
    }
}

async function monitorTickets() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    const url = 'https://shop.royalchallengers.com/merchandise';
    
    let foundTickets = false;
    
    try {
        console.log(`🔍 Starting to monitor: ${url}`);
        console.log('📍 Looking for button with keywords: "ticket", "tickets", or "buy tickets"');
        console.log('⏰ Will refresh every 1 minute\n');
        
        while (true) {
            try {
                // Navigate to the page
                await page.goto(url, { waitUntil: 'networkidle' });
                console.log(`[${new Date().toLocaleTimeString()}] Page loaded`);
                
                // Find all buttons and check if any contain ticket-related keywords
                const ticketButtons = await page.locator('button').all();
                let foundButton = false;
                
                for (const button of ticketButtons) {
                    const buttonText = await button.textContent();
                    const lowerText = buttonText.toLowerCase();
                    // Check for variations: "ticket", "tickets", or "buy tickets"
                    if (lowerText.includes('ticket') || lowerText.includes('buy ticket')) {
                        foundButton = true;
                        break;
                    }
                }
                
                // Check if ticket button exists
                if (foundButton) {
                    console.log(`\n✅ FOUND button with ticket keywords on the page!`);
                    
                    if (!foundTickets) {
                        foundTickets = true;
                        // Play a loud beep sound multiple times
                        console.log('🔊 Playing alert sound...\n');
                        for (let i = 0; i < 3; i++) {
                            beep();
                        }
                    }
                } else {
                    if (foundTickets) {
                        console.log(`[${new Date().toLocaleTimeString()}] Ticket button no longer on page`);
                        foundTickets = false;
                    } else {
                        console.log(`[${new Date().toLocaleTimeString()}] Ticket button not found yet, waiting...`);
                    }
                }
                
                // Wait 1 minute before refreshing
                console.log('⏳ Waiting 1 minute before refresh...');
                await page.waitForTimeout(60000);
                
            } catch (error) {
                console.error(`Error during check: ${error.message}`);
                console.log('Retrying in 1 minute...');
                await page.waitForTimeout(60000);
            }
        }
        
    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        await browser.close();
    }
}

// Run the monitor
monitorTickets().catch(console.error);
