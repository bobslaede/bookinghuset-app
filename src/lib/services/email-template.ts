import { type Artist, GraphCMSStatus } from '../types';
import { resizeImage } from './graphql';

function getPrice(
  artist: Artist,
  priceType: string,
  priceTypeFallback: string,
): string {
  const hasFallback = priceTypeFallback !== '';
  const fallback = hasFallback
    ? (artist[priceTypeFallback as keyof Artist] as string) ?? ''
    : '';
  const price = (artist[priceType as keyof Artist] as string) ?? fallback;
  return price.replace(/\n/g, '<br />\n');
}

function renderArtistItem(
  artist: Artist,
  priceType: string,
  priceTypeFallback: string,
  imageBaseUrl: string,
): string {
  const imgSrc = artist.thumbnail
    ? resizeImage(artist.thumbnail.handle, {
        width: 200,
        height: 125,
        align: 'faces',
        fit: 'crop',
      }, imageBaseUrl)
    : '';

  const isPublished = artist.stage === GraphCMSStatus.PUBLISHED;
  const link = `https://bookinghuset.dk/booking/${artist.slug}.html`;
  const price = getPrice(artist, priceType, priceTypeFallback);

  const nameHtml = isPublished
    ? `<a href="${link}" style="text-decoration: none; color: #085859;"><h4 style="margin-bottom: .2em; font-size: 1.2em; margin-top: 0;">${artist.name}</h4></a>`
    : `<h4 style="margin-bottom: .2em; font-size: 1.2em; margin-top: 0;">${artist.name}</h4>`;

  const imgTag = imgSrc
    ? `<img src="${imgSrc}" style="border: 0;" alt="${artist.name}">`
    : '';

  const imageHtml =
    isPublished && imgSrc
      ? `<a href="${link}">${imgTag}</a>`
      : imgTag;

  return `<table width="640" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:640px; width:100%;" bgcolor="#FFFFFF">
  <tr>
    <td align="center" valign="top" style="padding:10px;">
      <table width="600" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:600px; width:100%;">
        <tr>
          <td width="400" align="left" valign="top" style="padding-right: 10px;">
            ${nameHtml}
            <p>${price}</p>
          </td>
          <td width="200" align="center" valign="top">
            ${imageHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

function hrSection(): string {
  return `<table width="640" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:640px; width:100%;" bgcolor="#FFFFFF">
  <tr>
    <td align="center" valign="top" style="padding:10px;">
      <table width="600" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:600px; width:100%;">
        <tr>
          <td align="left" valign="top"><hr></td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function generateEmailHtml(
  artists: Artist[],
  introTextHtml: string,
  priceType: string,
  priceTypeFallback: string,
  imageBaseUrl: string,
): string {
  const artistItems = artists
    .map((a) => renderArtistItem(a, priceType, priceTypeFallback, imageBaseUrl))
    .join('\n');

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html lang="da">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Bookinghuset</title>
</head>
<body style="margin:0; padding:0; background-color:#F2F2F2;">
<center>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    p, a, td, span, div, th, body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif; }
    table { border-collapse: collapse !important; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; font-size: 14px; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    div[style*="margin: 16px 0;"] { margin: 0 !important; }
  </style>

  <div style="background-color:#F2F2F2; max-width: 640px; margin: auto; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;">

    <table width="640" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:640px; width:100%;" bgcolor="#FFFFFF">
      <tr>
        <td align="center" valign="top" style="padding:0px;">
          <table width="350" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:390px; width:100%;">
            <tr>
              <td width="40" align="center" valign="top">
                <a href="https://bookinghuset.dk/">
                  <img src="https://bookinghuset.dk/static/logo_192.png" alt="B" style="border:0;font-size:30px;color: #0A3343; display: block; width: 40px; height: 40px;">
                </a>
              </td>
              <td width="300" align="left" valign="top" style="padding-left: 10px;">
                <a href="https://bookinghuset.dk/" style="font-size:30px;color: #0A3343; text-decoration: none; font-family: 'Roboto', 'Helvetica Neue', Verdana, sans-serif">
                  <span style="font-weight: bold;">BOOKING</span><span style="font-weight: 100;">HUSET</span>
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="640" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:640px; width:100%;" bgcolor="#FFFFFF">
      <tr>
        <td align="center" valign="top" style="padding:10px;">
          <table width="600" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:600px; width:100%;">
            <tr>
              <td align="left" valign="top">${introTextHtml}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${hrSection()}

    ${artistItems}

    ${hrSection()}

    <table width="640" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:640px; width:100%;" bgcolor="#FFFFFF">
      <tr>
        <td align="center" valign="top" style="padding:10px;">
          <table width="600" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:600px; width:100%;">
            <tr>
              <td align="left" valign="top">
                <p>Alle priserne er vejledende og kan variere efter afstand og størrelse af arrangement.</p>
                <p>Priserne er incl. provision (excl. moms af denne).</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

  </div>
</center>
</body>
</html>`;
}
