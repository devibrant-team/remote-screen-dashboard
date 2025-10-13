// src/Play/Normal/PlaylistSwiper.tsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/autoplay";
// @ts-ignore
import "swiper/css/effect-fade";

import WeatherWidget from "../../Components/NormalPlayListComp/Widgets/WeatherWidget";
import OclockWidget from "../../Components/NormalPlayListComp/Widgets/OclockWidget";

// Position helper for widget overlays
const posClass = (pos?: string) => {
  switch ((pos || "center").toLowerCase()) {
    case "top-left": return "top-4 left-4";
    case "top-right": return "top-4 right-4";
    case "bottom-left": return "bottom-4 left-4";
    case "bottom-right": return "bottom-4 right-4";
    case "center": default: return "inset-0 flex items-center justify-center";
  }
};

// Individual slot (media + optional widget overlay)
const SlotView: React.FC<{ slot: any }> = ({ slot }) => {
  const src: string | undefined = slot?.media ?? undefined;
  const fit =
    (slot?.scale as "fit" | "cover" | "blur") === "cover"
      ? "object-cover"
      : "object-contain";

  // Base media
  let mediaEl: React.ReactNode = null;
  if (slot?.mediaType === "video") {
    mediaEl = (
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className={`w-full h-full ${fit}`}
      />
    );
  } else if (slot?.mediaType === "website") {
    mediaEl = (
      <iframe
        src={src}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
      />
    );
  } else if (slot?.media) {
    // default image
    mediaEl = (
      <img
        src={src}
        alt=""
        draggable={false}
        className={`w-full h-full ${fit}`}
      />
    );
  }

  // Blur style (if requested)
  const blurWrap =
    slot?.scale === "blur"
      ? "filter blur-sm brightness-75"
      : "";

  // Optional widget overlay
  let widgetEl: React.ReactNode = null;
  if (slot?.widget?.type === "weather") {
    widgetEl = (
      <div className={`absolute ${posClass(slot.widget.position)}`}>
        <WeatherWidget city={slot.widget.city} compact />
      </div>
    );
  } else if (slot?.widget?.type === "clock") {
    widgetEl = (
      <div className={`absolute ${posClass(slot.widget.position)}`}>
        <OclockWidget />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className={`w-full h-full ${blurWrap}`}>{mediaEl}</div>
      {widgetEl}
    </div>
  );
};

// Slide renderer: handles fourGrid (grid_style=6 or selectedGrid='fourGrid')
const SlideView: React.FC<{ slide: any }> = ({ slide }) => {
  const isFourGrid =
    slide?.selectedGrid === "fourGrid" || Number(slide?.grid_style) === 6;

  if (isFourGrid) {
    const slots = slide?.slots ?? [];
    return (
      <div className="grid w-full h-full grid-cols-2 grid-rows-2 gap-2 p-2">
        {slots.slice(0, 4).map((slot: any) => (
          <div key={slot.id} className="w-full h-full bg-black">
            <SlotView slot={slot} />
          </div>
        ))}
      </div>
    );
  }

  // default: render all slots stacked (first fills screen)
  const slots = slide?.slots ?? [];
  if (slots.length <= 1) {
    return (
      <div className="w-full h-full bg-black">
        {slots[0] ? <SlotView slot={slots[0]} /> : null}
      </div>
    );
  }

  // simple responsive grid fallback for multi-slot
  const cols = Math.min(slots.length, 3);
  return (
    <div
      className="w-full h-full grid gap-2 p-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
    >
      {slots.map((slot: any) => (
        <div key={slot.id} className="w-full h-full bg-black">
          <SlotView slot={slot} />
        </div>
      ))}
    </div>
  );
};

const PlaylistSwiper: React.FC = () => {
  // Use your provided playlist example (with weather/clock widgets)
  const playlist = {
    id: 18,
    name: "dsfs",
    isEdit: true,
    type: 1,
    selectedCity: "Abha",
    selectedRatio: {
      id: 1,
      ratio: "16:9",
      numerator: "16.00",
      denominator: "9.00",
      width: null,
      height: null,
    },
    selectedSlideIndex: 0,
    slides: [
      {
        id: "66",
        duration: 10,
        grid_style: 6,
        selectedGrid: "fourGrid",
        slots: [
          {
            id: 75,
            index: 0,
            media:
              "https://srv964353.hstgr.cloud/storage/media/user-a-2/interactive/interactive1/iUH7lZFn2xo4g8rdxic4.png",
            mediaId: 9,
            mediaType: "image",
            scale: "blur",
            ImageFile: null,
            widget: null,
          },
          {
            id: 76,
            index: 1,
            media:
              "https://srv964353.hstgr.cloud/storage/media/user-a-2/interactive/interactive1/v07JhxmDuXW3VDPo6I8F.png",
            mediaId: 10,
            mediaType: "image",
            scale: "fit",
          },
          {
            id: 77,
            index: 2,
            media:
              "https://srv964353.hstgr.cloud/storage/media/user-a-2/library/0Ol5iuD5eFZT4JfGCKJP.png",
            mediaId: 19,
            mediaType: "image",
            scale: "fit",
          },
          {
            id: 78,
            index: 3,
            media:
              "https://srv964353.hstgr.cloud/storage/media/user-a-2/interactive/interactive1/cxlkPbR4UU81F6GLnRHs.png",
            mediaId: 11,
            mediaType: "image",
            scale: "fit",
          },
        ],
      },
      {
        id: "67",
        duration: 10,
        grid_style: 1,
        selectedGrid: "default",
        slots: [
          {
            id: 79,
            index: 0,
            media:
              "https://srv964353.hstgr.cloud/storage/media/user-a-2/library/0Ol5iuD5eFZT4JfGCKJP.png",
            mediaId: 19,
            mediaType: "image",
            scale: "fit",
            widget: { id: 1, type: "weather", city: "Abha", position: "center" },
          },
        ],
      },
      {
        id: "68",
        duration: 10,
        grid_style: 1,
        selectedGrid: "default",
        slots: [
          {
            id: 80,
            index: 0,
            media:
              "https://srv964353.hstgr.cloud/storage/media/user-a-2/library/0Ol5iuD5eFZT4JfGCKJP.png",
            mediaId: 19,
            mediaType: "image",
            scale: "fit",
            widget: { id: 2, type: "clock", city: "Abha", position: "center" },
          },
        ],
      },
    ],
  };

  const slides = playlist.slides ?? [];

  if (!slides.length) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-gray-300">
        No slides in playlist
      </div>
    );
  }

  return (
    <Swiper
      modules={[Autoplay, EffectFade]}
      slidesPerView={1}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      speed={600}
      loop
      allowTouchMove={false}
      autoplay={{ delay: 999_999, disableOnInteraction: false }}
      initialSlide={Math.max(0, playlist.selectedSlideIndex ?? 0)}
      onSwiper={(swiper) => {
        const i = swiper.realIndex;
        const dur = (slides[i]?.duration ?? 5) * 1000;
        if (swiper.params.autoplay && typeof swiper.params.autoplay === "object") {
          swiper.params.autoplay.delay = dur;
        } else {
          swiper.params.autoplay = { delay: dur, disableOnInteraction: false };
        }
        swiper.autoplay?.start();
      }}
      onSlideChange={(swiper) => {
        const i = swiper.realIndex;
        const dur = (slides[i]?.duration ?? 5) * 1000;
        if (swiper.params.autoplay && typeof swiper.params.autoplay === "object") {
          swiper.params.autoplay.delay = dur;
        } else {
          swiper.params.autoplay = { delay: dur, disableOnInteraction: false };
        }
        swiper.autoplay?.start();
      }}
      className="w-screen h-screen bg-black"
    >
      {slides.map((slide) => (
        <SwiperSlide key={slide.id}>
          <SlideView slide={slide} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default PlaylistSwiper;
