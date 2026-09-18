import { ArtisanProfile, MatchedArtisan, ProductCategory, Product, RFQ, BuyerOrder, B2BProfile } from '../types';

export const ARTISAN_PROFILES: Record<string, ArtisanProfile> = {
  'prod-1': {
    id: 'artisan-1',
    name: 'Ramesh Prajapati & Sons',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    location: 'Molela Village, Rajsamand',
    state: 'Rajasthan',
    cluster: 'Molela Terracotta GI Cluster',
    experienceYears: 34,
    speciality: 'Hand-thrown terracotta & ceremonial votive plaques',
    giTag: 'GI Registry #124 (Molela Clay Work)',
    heritageStory: {
      en: '4th generation clay artisan preserving traditional Banas riverbank terracotta firing techniques passed down from his great-grandfather.',
      hi: 'बनास नदी किनारे की पारंपरिक टेराकोटा मिट्टी तकनीक को सहेज रहे चौथी पीढ़ी के शिल्पी।',
      mr: 'बनास नदीच्या काठच्या पारंपारिक मातीकाम तंत्राचा वारसा जपणारे चौथी पिढीचे कारागीर.',
    },
    capacityPerMonth: 450,
    rating: 4.9,
    reviewsCount: 118,
    responseRate: '< 2 hrs',
  },
  'prod-2': {
    id: 'artisan-2',
    name: 'Devi Ahilya Weavers Cooperative',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    location: 'Chanderi, Ashoknagar',
    state: 'Madhya Pradesh',
    cluster: 'Chanderi Handloom Heritage Guild',
    experienceYears: 28,
    speciality: 'Pure silk-cotton weaves with gold zari interlock technique',
    giTag: 'GI Registry #4 (Chanderi Sarees)',
    heritageStory: {
      en: 'A collective of 42 master women weavers preserving the gossamer-fine Chanderi weave pioneered during the Malwa Sultanate.',
      hi: '42 कुशल महिला बुनकरों का समूह जो मालवा सल्तनत काल की महीन चंदेरी बुनाई को जीवित रख रही हैं।',
      mr: '४२ महिला विणकरांचा गट, जो ऐतिहासिक चंदेरी हातमागाचा समृद्ध वारसा जपत आहे.',
    },
    capacityPerMonth: 85,
    rating: 4.95,
    reviewsCount: 240,
    responseRate: '< 1 hr',
  },
  'prod-3': {
    id: 'artisan-3',
    name: 'Bastar Dhokra Shilp Kala Mandir',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    location: 'Kondagaon, Bastar',
    state: 'Chhattisgarh',
    cluster: 'Bastar Dhokra Bell Metal Cluster',
    experienceYears: 40,
    speciality: '4000-year-old non-ferrous lost-wax metal casting (cire perdue)',
    giTag: 'GI Registry #83 (Bastar Dhokra)',
    heritageStory: {
      en: 'Belonging to the indigenous Ghadwa tribal community, continuing the oldest bronze and brass metallurgy traditions dating back to Mohenjo-daro.',
      hi: 'मोहनजोदड़ो काल की प्राचीन मोम-धातु ढलाई परंपरा को आगे बढ़ाते घड़वा आदिवासी समुदाय के मास्टर कारीगर।',
      mr: 'मोहेंजो-दडो काळातील प्राचीन धातू ओतकाम तंत्र जपणारे घड्वा आदिवासी कारागीर.',
    },
    capacityPerMonth: 120,
    rating: 4.88,
    reviewsCount: 96,
    responseRate: '< 3 hrs',
  },
  'prod-4': {
    id: 'artisan-4',
    name: 'Haji Mohammad & Brothers',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    location: 'Saharanpur',
    state: 'Uttar Pradesh',
    cluster: 'Saharanpur Wood Craft Guild',
    experienceYears: 32,
    speciality: 'Jali lattice relief carving and pure brass inlay on Sheesham',
    giTag: 'GI Registry #427 (Saharanpur Wood Carving)',
    heritageStory: {
      en: 'Master wood-turners transforming legally harvested seasoned Sheesham and mango wood into ornate functional heirlooms using hand-chisels.',
      hi: 'हाथ की छेनी से शीशम की लकड़ी पर बारीक जाली नक्काशी और पीतल की जड़ाई में महारत हासिल।',
      mr: 'हात छन्नीने शीशम लाकडावर सुबक कोरीव काम व पितळी नक्षीकाम करणारे नामवंत कारागीर.',
    },
    capacityPerMonth: 250,
    rating: 4.82,
    reviewsCount: 78,
    responseRate: '< 4 hrs',
  },
  'prod-5': {
    id: 'artisan-5',
    name: 'Khurja Traditional Kilns Union',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    location: 'Khurja, Bulandshahr',
    state: 'Uttar Pradesh',
    cluster: 'Khurja Pottery Cluster',
    experienceYears: 24,
    speciality: 'Lead-free high-fire tableware with natural cobalt blue slip glazes',
    giTag: 'GI Registry #178 (Khurja Pottery)',
    heritageStory: {
      en: '600-year-old Ceramic City craftspeople blending botanical slips and modern food-grade double-firing for everyday heritage dining.',
      hi: '600 वर्ष पुरानी खुरजा मिट्टी परंपरा, सीसा-मुक्त और प्राकृतिक रंगों से बनी टिकाऊ क्राफ्ट क्रॉकरी।',
      mr: '६०० वर्षे जुनी खुरजा मातीची परंपरा, अन्न-सुरक्षित आणि नैसर्गिक रंगांनी बनवलेली क्रॉकरी.',
    },
    capacityPerMonth: 1500,
    rating: 4.9,
    reviewsCount: 310,
    responseRate: '< 1 hr',
  },
  'prod-6': {
    id: 'artisan-6',
    name: 'Hooghly Golden Fiber Artisans',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    location: 'Chinsurah, Hooghly',
    state: 'West Bengal',
    cluster: 'Bengal Jute Craft Society',
    experienceYears: 19,
    speciality: 'Organic unbleached golden fiber knotting, macrame, and botanical dyes',
    giTag: 'GI Registry #521 (Bengal Jute Diversified Art)',
    heritageStory: {
      en: 'Eco-conscious women self-help collective transforming Ganges delta golden jute fibers into modern sustainable interior statements.',
      hi: 'गंगा डेल्टा के प्राकृतिक जूट रेशों से पर्यावरण-अनुकूल आधुनिक होम डेकोर बनाती महिला कारीगर।',
      mr: 'गंगा खोऱ्यातील अस्सल तागापासून पर्यावरणस्नेही आधुनिक सजावट बनवणारी महिला कारागीर संस्था.',
    },
    capacityPerMonth: 380,
    rating: 4.86,
    reviewsCount: 64,
    responseRate: '< 2 hrs',
  },
};

export const ARTISAN_CLUSTERS_DATABASE = [
  {
    id: 'cluster-pottery-1',
    name: 'Molela Terracotta Cooperative',
    cluster: 'Molela Heritage Clay Guild',
    location: 'Rajsamand, Rajasthan',
    category: 'pottery' as ProductCategory,
    speciality: 'Votive plaques & Hand-painted clay pottery',
    basePrice: 1200,
    capacityPerMonth: 600,
    rating: 4.9,
    completedOrders: 142,
    giCertified: true,
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cluster-pottery-2',
    name: 'Khurja Studio Ceramic Society',
    cluster: 'Khurja Pottery Park',
    location: 'Bulandshahr, Uttar Pradesh',
    category: 'pottery' as ProductCategory,
    speciality: 'Lead-free glazed tableware & kulhads',
    basePrice: 650,
    capacityPerMonth: 2500,
    rating: 4.85,
    completedOrders: 310,
    giCertified: true,
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cluster-textiles-1',
    name: 'Chanderi Weaver Welfare Guild',
    cluster: 'Pranpur Handloom Cluster',
    location: 'Ashoknagar, Madhya Pradesh',
    category: 'textiles' as ProductCategory,
    speciality: 'Silk Zari Sarees & Dupattas with GI protection',
    basePrice: 4800,
    capacityPerMonth: 120,
    rating: 4.95,
    completedOrders: 230,
    giCertified: true,
    imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cluster-textiles-2',
    name: 'Kutch Ajrakhpur Block Printers',
    cluster: 'Dhamadka & Ajrakhpur Guild',
    location: 'Bhuj, Gujarat',
    category: 'textiles' as ProductCategory,
    speciality: 'Natural indigo & madder hand block printed yardage',
    basePrice: 1800,
    capacityPerMonth: 400,
    rating: 4.92,
    completedOrders: 185,
    giCertified: true,
    imageUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cluster-brass-1',
    name: 'Bastar Bell Metal Craftsmen Union',
    cluster: 'Kondagaon Shilpgram',
    location: 'Bastar, Chhattisgarh',
    category: 'brass' as ProductCategory,
    speciality: 'Lost-wax Dhokra brass figurines & mementos',
    basePrice: 2400,
    capacityPerMonth: 180,
    rating: 4.88,
    completedOrders: 94,
    giCertified: true,
    imageUrl: 'https://images.unsplash.com/photo-1584281722572-ca497e748281?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cluster-brass-2',
    name: 'Moradabad Master Metalworkers',
    cluster: 'Peetal Nagri Export Society',
    location: 'Moradabad, Uttar Pradesh',
    category: 'brass' as ProductCategory,
    speciality: 'Polished brass bowls, planters & decorative lighting',
    basePrice: 1600,
    capacityPerMonth: 800,
    rating: 4.8,
    completedOrders: 275,
    giCertified: true,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cluster-wood-1',
    name: 'Saharanpur Wood Carvers Association',
    cluster: 'Saharanpur Woodcraft Hub',
    location: 'Saharanpur, Uttar Pradesh',
    category: 'wood' as ProductCategory,
    speciality: 'Carved Sheesham spice boxes & corporate organizers',
    basePrice: 950,
    capacityPerMonth: 500,
    rating: 4.84,
    completedOrders: 160,
    giCertified: true,
    imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cluster-wood-2',
    name: 'Channapatna Lacquerware Cooperative',
    cluster: 'Gombegala Ooru Toy Cluster',
    location: 'Ramanagara, Karnataka',
    category: 'wood' as ProductCategory,
    speciality: 'Vegetable-dyed Wrightia tinctoria turned wood crafts',
    basePrice: 550,
    capacityPerMonth: 1200,
    rating: 4.89,
    completedOrders: 320,
    giCertified: true,
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cluster-jute-1',
    name: 'Bengal Golden Fiber Guild',
    cluster: 'Hooghly Jute Diversified Cluster',
    location: 'Hooghly, West Bengal',
    category: 'jute' as ProductCategory,
    speciality: 'Custom branded jute bags, conference folders & tapestries',
    basePrice: 650,
    capacityPerMonth: 1000,
    rating: 4.87,
    completedOrders: 215,
    giCertified: true,
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&auto=format&fit=crop&q=80',
  },
];

/**
 * Real mathematical weighted matching function for B2B RFQs.
 * Computes match percentage based on:
 * - Category alignment (40%)
 * - Budget overlap (35%)
 * - Volume / monthly capacity fit (15%)
 * - Certified cluster rating & reliability (10%)
 */
export function calculateArtisanMatches(rfq: {
  category: ProductCategory;
  quantity: number;
  targetBudget: number;
}): MatchedArtisan[] {
  return ARTISAN_CLUSTERS_DATABASE.map((cluster) => {
    // 1. Category Alignment (Weight: 40%)
    let categoryScore = 25;
    if (cluster.category === rfq.category) {
      categoryScore = 100;
    } else if (rfq.category === 'all') {
      categoryScore = 80;
    }

    // 2. Budget Compatibility (Weight: 35%)
    // Compare target budget per unit against cluster base price
    const budgetRatio = rfq.targetBudget / Math.max(1, cluster.basePrice);
    let budgetScore = 50;
    if (budgetRatio >= 1.0) {
      // Buyer budget meets or exceeds base price: great fit!
      budgetScore = Math.min(100, Math.round(90 + (budgetRatio - 1.0) * 10));
    } else if (budgetRatio >= 0.8) {
      // Within 20% negotiable range
      budgetScore = Math.round(70 + ((budgetRatio - 0.8) / 0.2) * 20);
    } else if (budgetRatio >= 0.6) {
      budgetScore = Math.round(45 + ((budgetRatio - 0.6) / 0.2) * 25);
    } else {
      budgetScore = Math.max(20, Math.round(budgetRatio * 40));
    }

    // 3. Capacity / Volume Suitability (Weight: 15%)
    // Ideal if monthly capacity is >= 1.5x of request
    const capacityRatio = cluster.capacityPerMonth / Math.max(1, rfq.quantity);
    let capacityScore = 60;
    if (capacityRatio >= 1.5) {
      capacityScore = 100;
    } else if (capacityRatio >= 1.0) {
      capacityScore = 88;
    } else if (capacityRatio >= 0.6) {
      capacityScore = 68;
    } else {
      capacityScore = 40;
    }

    // 4. Cluster Quality & Rating (Weight: 10%)
    const locationScore = Math.round((cluster.rating / 5) * 100);

    // Final weighted score calculation
    const weightedScore = Math.round(
      categoryScore * 0.4 +
        budgetScore * 0.35 +
        capacityScore * 0.15 +
        locationScore * 0.1
    );

    const matchScore = Math.min(99, Math.max(42, weightedScore));

    return {
      id: cluster.id,
      name: cluster.name,
      cluster: cluster.cluster,
      location: cluster.location,
      speciality: cluster.speciality,
      rating: cluster.rating,
      completedOrders: cluster.completedOrders,
      capacityPerMonth: cluster.capacityPerMonth,
      matchScore,
      breakdown: {
        categoryScore,
        budgetScore,
        capacityScore,
        locationScore,
      },
      suggestedPrice: Math.round(
        rfq.targetBudget > 0
          ? Math.max(cluster.basePrice, Math.min(cluster.basePrice * 1.15, (rfq.targetBudget + cluster.basePrice) / 2))
          : cluster.basePrice
      ),
      imageUrl: cluster.imageUrl,
      giCertified: cluster.giCertified,
    };
  })
    // Sort highest match first
    .sort((a, b) => b.matchScore - a.matchScore);
}

export const INITIAL_BUYER_ORDERS: BuyerOrder[] = [
  {
    id: 'BYR-ORD-1049',
    type: 'b2c',
    items: [
      {
        product: {
          id: 'prod-1',
          sku: 'KALA-TC-081',
          title: {
            en: 'Hand-painted Terracotta Clay Vase',
            hi: 'हाथ से चित्रित टेराकोटा मिट्टी का फूलदान',
            mr: 'हात रंगवलेली टेराकोटा मातीची फुलदाणी',
          },
          category: 'pottery',
          categoryLabel: {
            en: 'Handmade Terracotta',
            hi: 'हस्तनिर्मित टेराकोटा',
            mr: 'हस्तनिर्मित टेराकोटा',
          },
          price: 1850,
          mrp: 2400,
          discountPercent: 23,
          inStock: true,
          stockCount: 14,
          views: 48,
          sold: 12,
          imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBs5bp8EhpGMkFW42TorHnIKCSon5Xasq4s8ZRGaZ_rT2fPvKlc4bHVGR2K6GSQFENT7iWt7wl3Z0nDHiTqawnmzMq93Htdek73P6gJtbF13zWRvU7Ye1VtgCFb-rU6R1NGFAn2axMfAa3Ku31tq_lKTrxZGKyDa1gJxVw0sg5SsEDLyTGIDXYmMIYay48tz3ojBv66HClVmc_QActkv8rvg1CvLR2FOEbpV1FBKMo94_F9aNlw4XyQGQ',
          altText: 'Handcrafted terracotta vase',
          tags: ['pottery', 'terracotta'],
        },
        quantity: 1,
        unitPrice: 1850,
        customNote: 'Personal gift message inscribed on packaging',
      },
    ],
    totalAmount: 1850,
    status: 'in_crafting',
    currentStep: 2,
    createdAt: 'Yesterday, 4:30 PM',
    artisanName: 'Ramesh Prajapati & Sons',
    artisanCluster: 'Molela Terracotta GI Cluster, Rajasthan',
    deliveryEstimate: 'Arriving by Friday, Oct 18',
  },
  {
    id: 'BYR-RFQ-902',
    type: 'b2b',
    items: [
      {
        product: {
          id: 'prod-4',
          sku: 'KALA-WD-044',
          title: {
            en: 'Carved Sheesham Wood Spice Box',
            hi: 'नक्काशीदार शीशम की लकड़ी का मसाला बॉक्स',
            mr: 'कोरीव शीशम लाकडी मसाल्यांचा डबा',
          },
          category: 'wood',
          categoryLabel: {
            en: 'Wood Carving',
            hi: 'काष्ठ नक्काशी',
            mr: 'लाकूड कोरीव काम',
          },
          price: 1450,
          mrp: 1950,
          discountPercent: 25,
          inStock: true,
          stockCount: 11,
          views: 64,
          sold: 15,
          imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuArCKBkyuC6dsvyRjTL0Bmkeo_U_9om6-tNpVNuE6EtbnjXB5KVhmHlWzB8fCjVWXykvEKbnRv0d-H65_QRKz30bmhj3LxslLA6Az3BwNEWYeRyvHbu33hflFZTTEFyv4Fbsnt6GKMwSM6eADwTuWH6dJLqlS0qWy0aygGDpmmR3UyJ_YNsW0LmjVfgG7dZbfZcG9vSEi2VyAxwja1Pd9kwmlTdRhuoHnl8PzbqNaJZKcZl-cGj7ghwag',
          altText: 'Sheesham spice box',
          tags: ['wood', 'corporate'],
        },
        quantity: 50,
        unitPrice: 1150,
        customNote: 'Corporate Diwali Hamper: Laser engraved logo on brass clasp',
      },
    ],
    totalAmount: 57500,
    status: 'order_received',
    currentStep: 3,
    createdAt: '3 days ago',
    artisanName: 'Haji Mohammad & Brothers',
    artisanCluster: 'Saharanpur Wood Craft Guild, UP',
    deliveryEstimate: 'Dispatch planned Oct 24',
    rfqId: 'RFQ-782',
  },
];

export const INITIAL_RFQS: RFQ[] = [
  {
    id: 'RFQ-782',
    category: 'pottery',
    quantity: 100,
    targetBudget: 1100,
    deliveryDate: '2024-11-05',
    notes: 'Hand-painted festive Diya motifs with corporate packaging box for client festival gifting.',
    organizationName: 'Tata Consultancy Services - ESG Gifting',
    createdAt: '2 days ago',
    matchedArtisans: calculateArtisanMatches({
      category: 'pottery',
      quantity: 100,
      targetBudget: 1100,
    }),
    status: 'in_negotiation',
    selectedArtisan: {
      id: 'cluster-pottery-1',
      name: 'Molela Terracotta Cooperative',
      cluster: 'Molela Heritage Clay Guild',
      location: 'Rajsamand, Rajasthan',
      speciality: 'Votive plaques & Hand-painted clay pottery',
      rating: 4.9,
      completedOrders: 142,
      capacityPerMonth: 600,
      matchScore: 94,
      breakdown: {
        categoryScore: 100,
        budgetScore: 92,
        capacityScore: 100,
        locationScore: 98,
      },
      suggestedPrice: 1180,
      imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&auto=format&fit=crop&q=80',
      giCertified: true,
    },
    negotiationData: {
      buyerAskPrice: 1050,
      artisanCounterPrice: 1150,
      currentStep: 2,
      history: [
        {
          sender: 'buyer',
          amount: 1050,
          message: 'Targeting ₹1,050/unit for 100 customized terracotta vases with festive gold motifs and individual eco-boxes.',
          timestamp: '2 days ago',
        },
        {
          sender: 'artisan',
          amount: 1150,
          message: 'Namaste! We can craft all 100 pieces with authentic natural terracotta and include custom laser-engraved wooden tags for ₹1,150/unit. Delivery before Diwali guaranteed.',
          timestamp: 'Yesterday, 11:20 AM',
        },
      ],
    },
  },
];

export const DEFAULT_B2B_PROFILE: B2BProfile = {
  organizationName: 'Tata Consultancy Services - ESG Gifting',
  buyerIndustry: 'corporate',
  sourcingVolume: 'volume_200_1000',
  industry: 'corporate',
  targetVolume: 'volume_200_1000',
  contactPerson: 'Aditi Deshmukh',
  email: 'aditi.d@tcs-esg.com',
  phone: '+91 98201 44520',
};
