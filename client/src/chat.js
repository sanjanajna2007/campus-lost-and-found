// Intent-based local bot. Swap reply() for an AI API call later.
const R = [
 [/report|lost|found/, 'Use "Report lost" or "Report found" in the top menu. Add a clear description, date, approximate location and a photo.'],
 [/claim|verify|approve/, 'Open an item, press "Claim this item" and describe proof of ownership. An admin reviews it and you get a notification.'],
 [/search|find|browse/, 'Go to Browse and filter by category, status, date and location.'],
 [/safe|meet|scam/, 'Meet in public campus places, never share home addresses, and keep proof of ownership details private until verified.'],
 [/hi|hello|hey/, 'Hi! Ask me about reporting items, claims, searching or safety.']]
export const reply = q => (R.find(([re]) => re.test(q.toLowerCase())) || [0, 'I can help with reporting, searching, claims and safety. Try one of those.'])[1]
