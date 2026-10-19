import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f2d4a',
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 700,
            fontStyle: 'italic',
            color: '#ffffff',
          }}
        >
          Bookroom
        </div>
        <div
          style={{
            fontSize: 34,
            color: '#c9ad78',
            marginTop: 24,
          }}
        >
          Книжкова спільнота для обміну та продажу книг
        </div>
      </div>
    ),
    { ...size }
  );
}
