import { SampleVideo } from '../types';

export const SAMPLE_VIDEOS: SampleVideo[] = [
  {
    id: 'live-performance-jazz',
    title: 'Live Jazz Quartet in New Orleans',
    categoryName: 'Live Performance',
    durationStr: '00:00:48.000',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    description: 'Energetic outdoor live acoustic jazz performance with crowd movement and brass instruments.',
    isSuitable: true,
    precomputedResult: {
      video_duration: '00:00:48.000',
      suitability: {
        status: 'suitable',
        category: 'Live Performance',
        confidence: 0.98,
        reason: 'Presents a continuous live musical performance with rich visual activity, active performer interactions, crowd reactions, and clear acoustic sync.'
      },
      scenes: [
        {
          scene_id: 1,
          start_time: '00:00:00.000',
          end_time: '00:00:15.200',
          narrative_description: 'On a sunlit cobblestone courtyard, four musicians perform under a brick awning with hanging brass lanterns. A man in a blue vest plays a saxophone while making animated eye contact with a seated keyboardist. Nearby spectators tap their feet and cheer on the cobblestone walkway.'
        },
        {
          scene_id: 2,
          start_time: '00:00:15.200',
          end_time: '00:00:31.500',
          narrative_description: 'The camera shifts to a close-up of the trumpeter, who wears a dark fedora hat and brass-rimmed glasses. He steps forward toward the front row, swinging his instrument in rhythm as gold confetti glides down through the ambient sunlight. Passersby stop to film with handheld devices.'
        },
        {
          scene_id: 3,
          start_time: '00:00:31.500',
          end_time: '00:00:48.000',
          narrative_description: 'A wider view displays the entire ensemble standing side-by-side as the final cadence reaches its climax. The drummer raises both drumsticks overhead while smiling at the audience. The surrounding crowd erupts into applauding and cheering while clapping in rhythm.'
        }
      ],
      subtitles: [
        {
          subtitle_id: 1,
          start_time: '00:00:00.500',
          end_time: '00:00:04.200',
          type: 'Music',
          text: '[Upbeat jazz brass melody plays]'
        },
        {
          subtitle_id: 2,
          start_time: '00:00:04.500',
          end_time: '00:00:08.100',
          type: 'Spoken words',
          text: 'Welcome everybody, let us bring down the house today!'
        },
        {
          subtitle_id: 3,
          start_time: '00:00:15.500',
          end_time: '00:00:18.000',
          type: 'Vocal sound',
          text: '[cheering]'
        },
        {
          subtitle_id: 4,
          start_time: '00:00:18.100',
          end_time: '00:00:20.000',
          type: 'Sound effect',
          text: '[handclaps]'
        },
        {
          subtitle_id: 5,
          start_time: '00:00:20.100',
          end_time: '00:00:24.800',
          type: 'Music',
          text: '[singing]'
        },
        {
          subtitle_id: 6,
          start_time: '00:00:32.000',
          end_time: '00:00:35.400',
          type: 'Spoken words',
          text: 'Give it up for the rhythm section!'
        },
        {
          subtitle_id: 7,
          start_time: '00:00:42.000',
          end_time: '00:00:47.500',
          type: 'Vocal sound',
          text: '[shouting]'
        }
      ]
    }
  },
  {
    id: 'documentary-ocean',
    title: 'Pacific Marine Ecosystem Exploration',
    categoryName: 'Documentary',
    durationStr: '00:00:52.000',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Documentary shot of ocean marine life, coral reefs, and research divers underwater.',
    isSuitable: true,
    precomputedResult: {
      video_duration: '00:00:52.000',
      suitability: {
        status: 'suitable',
        category: 'Documentary',
        confidence: 0.96,
        reason: 'Contains structured educational narrative footage, varied underwater settings, physical researcher movements, and informative spoken narration.'
      },
      scenes: [
        {
          scene_id: 1,
          start_time: '00:00:00.000',
          end_time: '00:00:17.500',
          narrative_description: 'Beneath clear turquoise waters, two divers clad in black wetsuits and bright yellow oxygen tanks float near a sprawling coral reef formation. Shoals of silver fish dart between purple anemones in the shimmering sunlight filtering from the water surface.'
        },
        {
          scene_id: 2,
          start_time: '00:00:17.500',
          end_time: '00:00:34.000',
          narrative_description: 'A diver holding a waterproof clipboard inspects a tagged coral specimen attached to a metal research grid. Small sea turtles swim overhead while light rays filter through the underwater environment.'
        },
        {
          scene_id: 3,
          start_time: '00:00:34.000',
          end_time: '00:00:52.000',
          narrative_description: 'The divers ascend toward a scientific vessel anchored on the surface. White foam and bubbles surround the boat ladder as one diver signals a thumbs-up gesture to a crew member waiting on the upper deck.'
        }
      ],
      subtitles: [
        {
          subtitle_id: 1,
          start_time: '00:00:01.000',
          end_time: '00:00:05.800',
          type: 'Spoken words',
          text: 'Coral reefs support over twenty-five percent of all marine species.'
        },
        {
          subtitle_id: 2,
          start_time: '00:00:06.200',
          end_time: '00:00:11.000',
          type: 'Ambient sound',
          text: '[Underwater breathing regulator sounds and bubbling]'
        },
        {
          subtitle_id: 3,
          start_time: '00:00:18.000',
          end_time: '00:00:23.500',
          type: 'Spoken words',
          text: 'Our team monitors coral growth rates using non-invasive grid mapping.'
        },
        {
          subtitle_id: 4,
          start_time: '00:00:35.000',
          end_time: '00:00:39.800',
          type: 'Music',
          text: '[Gentle orchestral swell featuring acoustic strings]'
        },
        {
          subtitle_id: 5,
          start_time: '00:00:44.100',
          end_time: '00:00:49.000',
          type: 'Spoken words',
          text: 'Initial observations confirm encouraging recovery across restored zones.'
        }
      ]
    }
  },
  {
    id: 'advertisement-ebike',
    title: 'Urban Glide E-Bike Launch Commercial',
    categoryName: 'Advertisement',
    durationStr: '00:00:30.000',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    description: 'High-energy commercial montage showcasing an electric bike speeding across modern cityscapes.',
    isSuitable: true,
    precomputedResult: {
      video_duration: '00:00:30.000',
      suitability: {
        status: 'suitable',
        category: 'Advertisement',
        confidence: 0.99,
        reason: 'Demonstrates commercial product storytelling with dynamic scene changes, full-body cyclist movements, and energetic sound design.'
      },
      scenes: [
        {
          scene_id: 1,
          start_time: '00:00:00.000',
          end_time: '00:00:10.000',
          narrative_description: 'At dawn in a metropolitan downtown district, a cyclist wearing a matte black helmet glides past sleek glass skyscrapers. Sunlight glimmers off the matte frame of the bicycle as the rider smoothly accelerates along an empty bike lane.'
        },
        {
          scene_id: 2,
          start_time: '00:00:10.000',
          end_time: '00:00:20.000',
          narrative_description: 'The rider navigates a winding park pathway lined with autumn trees. Highlighting the rear wheel, a sleek integrated light glows bright red while the cyclist leans smoothly into a curve.'
        },
        {
          scene_id: 3,
          start_time: '00:00:20.000',
          end_time: '00:00:30.000',
          narrative_description: 'Arriving outside a modern café, the cyclist dismounts smoothly and folds the handlebars with one swift motion. The rider smiles toward the camera as city traffic passes in the background.'
        }
      ],
      subtitles: [
        {
          subtitle_id: 1,
          start_time: '00:00:01.200',
          end_time: '00:00:04.500',
          type: 'Sound effect',
          text: '[Electric motor hums quietly as bike accelerates]'
        },
        {
          subtitle_id: 2,
          start_time: '00:00:05.000',
          end_time: '00:00:08.800',
          type: 'Spoken words',
          text: 'Redefine your daily commute with effortless power.'
        },
        {
          subtitle_id: 3,
          start_time: '00:00:11.000',
          end_time: '00:00:15.200',
          type: 'Music',
          text: '[Dynamic synthwave beat plays]'
        },
        {
          subtitle_id: 4,
          start_time: '00:00:21.000',
          end_time: '00:00:25.500',
          type: 'Spoken words',
          text: 'Compact, intelligent, and built for the modern journey.'
        }
      ]
    }
  },
  {
    id: 'movie-trailer',
    title: 'Cinematic Sci-Fi Thriller Trailer',
    categoryName: 'Movie',
    durationStr: '00:00:45.000',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    description: 'Dramatic cinematic movie scene featuring futuristic corridors, dramatic lighting, and high tension.',
    isSuitable: true,
    precomputedResult: {
      video_duration: '00:00:45.000',
      suitability: {
        status: 'suitable',
        category: 'Movie',
        confidence: 0.97,
        reason: 'High cinematic story value with continuous visual actions, dramatic character progression, environmental depth, and synchronized dialogue.'
      },
      scenes: [
        {
          scene_id: 1,
          start_time: '00:00:00.000',
          end_time: '00:00:15.000',
          narrative_description: 'Inside a dimly lit metallic hallway with flickering blue overhead lights, a person in a reflective grey jacket creeps cautiously past exposed hydraulic pipes. Steam vents from wall valves as emergency warning lights pulse overhead.'
        },
        {
          scene_id: 2,
          start_time: '00:00:15.000',
          end_time: '00:00:30.000',
          narrative_description: 'The individual reaches a heavy blast door and swipes an illuminated access card across a glowing terminal. Red status indicators switch to green as pneumatics hiss and the door slides upward.'
        },
        {
          scene_id: 3,
          start_time: '00:00:30.000',
          end_time: '00:00:45.000',
          narrative_description: 'Stepping into a vast control chamber overlooking a glowing city below, the figure approaches a central glass display console. A second individual turns around from the control deck and extends a hand.'
        }
      ],
      subtitles: [
        {
          subtitle_id: 1,
          start_time: '00:00:02.000',
          end_time: '00:00:06.000',
          type: 'Sound effect',
          text: '[Alarm klaxon sounds intermittently in distance]'
        },
        {
          subtitle_id: 2,
          start_time: '00:00:07.500',
          end_time: '00:00:11.200',
          type: 'Spoken words',
          text: 'We only have three minutes before the main grid locks down.'
        },
        {
          subtitle_id: 3,
          start_time: '00:00:17.000',
          end_time: '00:00:19.800',
          type: 'Sound effect',
          text: '[Heavy hydraulic door hiss and metallic clank]'
        },
        {
          subtitle_id: 4,
          start_time: '00:00:32.000',
          end_time: '00:00:36.500',
          type: 'Spoken words',
          text: 'I knew you would find the override core in time.'
        },
        {
          subtitle_id: 5,
          start_time: '00:00:38.000',
          end_time: '00:00:43.000',
          type: 'Music',
          text: '[Dramatic orchestral brass climax and low percussion pulse]'
        }
      ]
    }
  },
  {
    id: 'discarded-talking-head',
    title: 'Static Interview Podcast (Burned-in Subtitles)',
    categoryName: 'Discarded Test Case',
    durationStr: '00:00:30.000',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    description: 'Static talking head interview featuring burned-in subtitle captions and minimal visual movement.',
    isSuitable: false,
    precomputedResult: {
      video_duration: '00:00:30.000',
      suitability: {
        status: 'discarded',
        category: null,
        confidence: 0.99,
        reason: 'Video discarded per criteria: Contains long static talking-head interview footage without meaningful visual progression, and contains hardcoded burned-in subtitles throughout.'
      },
      scenes: [],
      subtitles: []
    }
  }
];
