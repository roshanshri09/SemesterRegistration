import { Fragment, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import _ from "lodash";

import CustomPopup from "components/CustomPopup";
import PackageCard from "components/PackageCard";
import OfferCard from "components/OfferCard";
import Subtitle from "components/Subtitle";
import Popup from "components/Popup";
import Input from "components/Input";
import Button from "components/Button";
import Checkout from "containers/ProductDetails/CheckOut";
// import { getProductData } from "services/productDetails";
// import { getHomePageAPI } from "services/homePage";
// import { getEventUser } from "services/eventUser";
import {
  changeLanguage,
  clearProducts,
  getProductsDataForEvent,
  fetchCustomerOffersAction,
  fetchAccessCard,
  fetchCart,
  setCurrentAccessCardStateAction
} from "store/actions";
import useScreenMobile from "hooks/useScreenMobile";
import {
  currentOffersMobileSlide,
  overViewListSlide,
  previewImagesSlide
} from "constants/splideOptions";
// import ChildPreviewImg from "assets/images/home/studentImgSmall.png";
import Arrow from "assets/images/productDetails/arrowDropdown.svg";
import DividerLine from "assets/images/productDetails/dividerLine.png";
import PlusIcon from "assets/images/productDetails/plusIcon.svg";
import accessCode from "assets/images/accessPhoto/accessKey.svg";
import accessId from "assets/images/accessPhoto/accessId.svg";
import OverviewBoxIcon from "assets/images/productDetails/overviewBox.svg";
// import AvatarIcon from "assets/images/productDetails/boxIcon.svg";
import "containers/ProductDetails/productDetails.scss";
import "@splidejs/splide/dist/css/splide.min.css";
import { Spinner } from "custom/Spinner";
import { Tooltip } from "../../../node_modules/react-tooltip/dist/react-tooltip";

const ProductDetails = () => {
  const [sidePreview, setSidePreview] = useState(null);
  const [openList, setOpenList] = useState(false);
  const [selectedChild, setSelectedChild] = useState({});
  const [customizePopup, setCustomizePopup] = useState(null);
  const [activePackageCard, setActivePackageCard] = useState(null);
  const [activePackageCardData, setActivePackageCardData] = useState({});
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [packagesData, setPackagesData] = useState([]);
  const [activeImg, setActiveImg] = useState("");
  const [overviewBoxes, setOverviewBoxes] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [photoCart, setPhotoCartData] = useState([]);
  const [isLoading, setLoading] = useState({});
  const [accessCardId, setAccessCardId] = useState("");
  const [accessCardCode, setAccessCardCode] = useState("");
  const [accessCardErrors, setAccessCardErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupLoading, setPopupLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);


  const navigate = useNavigate();
  const location = useLocation();

  const currentAccessCardState = useSelector(
    (state) => state.currentAccessCard
  );

  const { orgSlug, eventSlug } = useParams();
  const state = location.state || currentAccessCardState || {};

  const photoIdFromState = state.photoId;
  const accessIdFromState = state.accessId;
  const accessCodeFromState = state.accessCode;
  const eventIdFromState = state.eventId;
  const albumIdFromState = state.albumId;

  // Fallback: Extract and parse the query parameters and fragment identifier if state values are not available
  const urlParams = new URLSearchParams(location.search);
  const accessUid = urlParams.get("access_uid") || "";
  const [accessIdFromUrl, accessCodeFromUrl] = accessUid.split("-");

  const fragment = location.hash.substring(1);
  const fragmentParts = fragment.split("/");

  const eventIdFromUrl = fragmentParts[0]?.replace("event-", "") || "";
  const albumIdFromUrl = fragmentParts[1]?.replace("album-", "") || "";
  const photoIdFromUrl = fragmentParts[3]?.replace("photo-", "") || "";

  // Final values: Prefer state values, otherwise fall back to parsed URL values
  const [photoId, setPhotoId] = useState(photoIdFromUrl || photoIdFromState);
  const [accessId1, setAccessId1] = useState(
    accessIdFromState || accessIdFromUrl
  );
  const [accessCode1, setAccessCode1] = useState(
    accessCodeFromState || accessCodeFromUrl
  );
  const [eventId, setEventId] = useState(eventIdFromState || eventIdFromUrl);
  const [albumId, setAlbumId] = useState(albumIdFromState || albumIdFromUrl);
  const [cartData, setCartData] = useState(null);

  const [offersFetched, setOffersFetched] = useState(false); // Track API call status

  const availOffer = useRef();

  const loading = useSelector((state) => state.loading);
  // const productsPhotoCart = useSelector((state) => state.products_photoCart);
  const products = useSelector((state) => state.products);
  const productEventName = useSelector((state) => state.eventName);
  const productEventId = useSelector((state) => state.eventId);

  const isMobile = useScreenMobile({ size: 768 });

  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const language = useSelector((state) => state.language);
  const offers = useSelector((store) => store.customerOffers || []);
  const accessCardData = useSelector((state) => state.accessCardData);
  const cart = useSelector((store) => store.cartData);
  const photoCart1 = useSelector((state) => state.photoCart);
  const cartLoading = useSelector((state) => state.cartLoading);
  const accessCardError = useSelector((state) => state.accessCardError);

  const { album } = !_.isEmpty(accessCardData)
    ? accessCardData.access_ids[accessId1]
    : {};

  const [ChildPreviewImg, setChildPreviewImg] = useState(accessCardData?.access_ids[accessId1]?.summary?.image_url);

  // const accessIdData = accessCardData?.selected_access_uid.split(":")[0];
  // const orgId =
  //   accessCardData && Object.keys(accessCardData).length > 0
  //     ? accessCardData.access_ids[accessIdData]?.org?.id || 0
  //     : 0;
  const [topPreview, setTopPreview] = useState(photoId);

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem("accessToken");
    setLoggedIn(isLoggedIn);
  }, [dispatch]);

  useEffect(() => {
    if (!state || Object.keys(state).length === 0) {
      dispatch(
        setCurrentAccessCardStateAction({
          eventId: eventId,
          accessId: accessId1,
          albumId: albumId,
          photoId: photoId,
          eventSlug: eventSlug,
          orgSlug: eventSlug,
          accessCode: accessCode1
        })
      );
    }
    setTopPreview(photoId);
  }, [accessId1, accessCode1, eventId, albumId, photoId]);

  useEffect(() => {
    dispatch(clearProducts());
    if (!accessCardData || Object.keys(accessCardData).length === 0) {
      if (accessId1 && accessCode1) {
        dispatch(fetchAccessCard(accessId1, accessCode1));
      } else {
        dispatch(fetchAccessCard());
      }
    }
    dispatch(fetchCart());
  }, []);


  useEffect(() => {
    if (!cartLoading && cart) {
      setCartData(cart);
    }
  }, [cart, cartLoading]);

  useEffect(() => {
    if (!offersFetched && offers.length === 0) {
      dispatch(fetchCustomerOffersAction());
      setOffersFetched(true); // Mark that the API call has been made
    }
  }, [offers.length, offersFetched, dispatch]);

  const prevState = useRef({
    photoId: state.photoId,
    accessId: state.accessId,
    eventId: state.eventId,
    albumId: state.albumId
  });

  const handleLoad = (img) => {
    setLoading((prevState) => ({
      ...prevState,
      [img]: false // Set loading to false for the specific image
    }));

    setDimensions({
      width: divPrintAreaRef.current.offsetWidth,
      height: divPrintAreaRef.current.offsetHeight
    });
  };

  useEffect(() => {
    if (activeImg) {
      setLoading((prevState) => ({
        ...prevState,
        [activeImg]: true // Set loading to true when activeImg changes
      }));
    }
  }, [activeImg]);

  useEffect(() => {
    if (products) {
      setProductsData(products);
      setPhotoCartData(photoCart1);
    }
  }, [products]);

  useEffect(() => {
    if (photoId && accessId && accessCode && eventId && albumId) {
      const constructedUrl = `/parents/product-details/${orgSlug}/${eventSlug}/?access_uid=${accessId1}-${accessCode1}#event-${eventId}/album-${albumId}/photos/photo-${topPreview || photoId}`;

      // Only navigate if the current URL does not match the constructed URL
      if (location.pathname !== constructedUrl) {
        navigate(constructedUrl, { replace: true });
      }
    }

    const fetchProductData = async () => {
      if (products == null) {
        dispatch(
          getProductsDataForEvent({
            eventId: eventId,
            accessId: accessId1,
            albumId: albumId,
            photoId: photoId
          })
        );
      }
      try {
        if (productsData && Object.keys(productsData).length > 0) {
          const selectedPhoto = album?.photos?.find(
            (photo) => photo.id === Number(topPreview)
          );
          const selectedPhotoTags = selectedPhoto?.tags || [];
          const filteredProducts = Object.keys(productsData)
            .map((id) => {
              const product = productsData[id];
              let photoCartEntry = null;
              // photoCart1 != null && Object.keys(photoCart1).length > 0
              //   ? photoCart1[id]
              //   : photoCart[id];

              // If photoCartEntry is not found, search in the cart using eventId
              if (photoCartEntry == null && Object.keys(cartData).length > 0) {
                const eventCart = cartData[eventId];
                if (eventCart && eventCart.items) {
                  const parsedId = parseInt(id, 10);
                  const parsedAccessId = parseInt(accessId1, 10);
                  const parsedAlbumId = parseInt(albumId, 10);

                  photoCartEntry = Object.values(eventCart.items).find((item) => {
                    const itemProductId = parseInt(item.product_type_id, 10);
                    const itemAccessId = parseInt(item.access_id, 10);
                    const itemAlbumId = parseInt(item.album_id, 10);

                    return itemProductId === parsedId &&
                      itemAccessId === parsedAccessId &&
                      itemAlbumId === parsedAlbumId;
                  });
                }
              }

              const productTags = product?.tags || [];
              const isTagMatching = selectedPhotoTags.some((tag) =>
                productTags.includes(tag)
              );

              return isTagMatching
                ? {
                  id: parseInt(id),
                  name: product?.name || "Unknown",
                  price: photoCartEntry ? photoCartEntry.price : 0,
                  oldAmount: null,
                  unitPrice: product?.selling_price,
                  samplePhotos: product?.sample_photos || [],
                  displayOrder: product?.display_order || 0,
                  count: photoCartEntry ? photoCartEntry.count : 0,
                  photo_id: photoId,
                  album_id: albumId,
                  access_id: accessId1,
                  access_code: accessCode1,
                  event_id: eventId,
                  explanation: product?.explanation
                }
                : null;
            })
            .filter((product) => product !== null)
            .sort((a, b) => a.displayOrder - b.displayOrder);


          setPackagesData(filteredProducts);
          setActivePackageCard(
            Number(activePackageCardData?.photo_id) == photoId
              ? activePackageCard
              : filteredProducts[0]?.id || null
          );
          setSelectedChild({
            id: accessId1 ? accessId1 : productEventName || "",
            name:
              accessCardData?.access_ids[accessId1].summary.album_name ||
              productEventId ||
              ""
          });
          setChildPreviewImg(accessCardData?.access_ids[accessId1].summary.image_url);

          if (
            filteredProducts.length > 0 &&
            (activePackageCard === null ||
              Number(activePackageCardData?.photo_id) != photoId)
          ) {
            const firstProduct = filteredProducts[0];
            const samplePhotos = firstProduct.samplePhotos;

            const updatedOverviewBoxes = samplePhotos.map((photo, index) => ({
              id: index,
              icon: OverviewBoxIcon,
              title: photo.page_name,
              thumbnail: photo.thumbnail,
              preview: photo.preview
            }));

            setOverviewBoxes(updatedOverviewBoxes);

            if (updatedOverviewBoxes.length > 0) {
              setSidePreview(updatedOverviewBoxes[0].id);
              setActiveImg(samplePhotos[0].thumbnail);
            }
          }
          // }
        } else {
          console.error("No products found in response");
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      }
    };

    const getImageData = async () => {
      // const fetchData = await getHomePageAPI(123);
      // setSelectImage(fetchData?.album?.photos);
    };

    prevState.current = {
      photoId: state.photoId,
      accessId: state.accessId,
      eventId: state.eventId,
      albumId: state.albumId
    };

    fetchProductData();
    getImageData();
    // getEventUserData();
  }, [
    currentAccessCardState,
    state.eventId,
    state.accessId,
    state.albumId,
    state.photoId,
    topPreview,
    products,
    productsData,
    photoCart,
    // productsPhotoCart,
    photoCart1,
    navigate,
    dispatch,
    location.pathname,
    accessCardData,
    accessId1,
    accessCode1,
    cart,
    cartData
  ]);

  useEffect(() => {
    dispatch(changeLanguage(language));
    i18n.changeLanguage(language);
  }, [dispatch, language]);

  // Adds resize event listener, updates size, removes on unmount.
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const sideOverviewBox = (id) => {
    setSidePreview(id);
    const selectedPhoto = overviewBoxes.find((box) => box.id === id);

    if (selectedPhoto) {
      setActiveImg(selectedPhoto.preview);
    } else {
      setActiveImg("");
    }
  };

  const topOverview = (id) => {
    setTopPreview(id);
    setPhotoId(Number(id));
  };

  const selectList = () => {
    setOpenList(!openList);
  };

  const childSelected = (data) => {
    dispatch(clearProducts());
    setPhotoId(data.album?.photos[0]?.id);
    setAccessId1(data.summary.access_id);
    setAccessCode1(data.summary.access_code);
    setEventId(data.summary.event_id);
    setAlbumId(data.summary.album_id);

    setTopPreview(data.album?.photos[0]?.id);
    const selectedChildData = {
      id: data.summary.access_id,
      name: data.summary.album_name
    };
    setSelectedChild(selectedChildData);
    setChildPreviewImg(data.summary.image_url);
    setOpenList(false);
  };

  const openCustomPopup = (popupType) => {
    setCustomizePopup(popupType);
  };

  const addNewCard = () => {
    openCustomPopup("addCard");
    setOpenList(false);
  };

  const handleClickCard = (data) => {
    const samplePhotos = data?.samplePhotos || [];

    const updatedOverviewBoxes = samplePhotos.map((photo, index) => ({
      id: index,
      icon: OverviewBoxIcon,
      title: photo.page_name
    }));

    setOverviewBoxes(updatedOverviewBoxes);

    setActiveImg(samplePhotos[0]?.preview || "");

    setActivePackageCard(data?.id);
    setActivePackageCardData(data);

    if (updatedOverviewBoxes.length > 0) {
      setSidePreview(updatedOverviewBoxes[0].id);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (id === "accessId") {
      setAccessCardId(value);
      setAccessCardErrors((prevErrors) => ({
        ...prevErrors,
        accessId: ""
      }));
    } else if (id === "accessCode") {
      setAccessCardCode(value);
      setAccessCardErrors((prevErrors) => ({
        ...prevErrors,
        accessCode: ""
      }));
    }
  };

  const handleSubmit = (e) => {
    setPopupLoading(true);
    e.preventDefault();
    const errors = {};

    const alphanumericRegex = /^[a-zA-Z0-9]+$/;

    if (!accessCardId) {
      errors.accessId = "Access ID is required";
    } else if (!alphanumericRegex.test(accessCardId)) {
      errors.accessId = "Access ID must not contain special characters";
    }

    if (!accessCardCode) {
      errors.accessCode = "Access Code is required";
    } else if (!alphanumericRegex.test(accessCardCode)) {
      errors.accessCode = "Access Code must not contain special characters";
    }

    if (Object.keys(errors).length > 0) {
      setAccessCardErrors(errors);
      return;
    }
    setIsSubmitting(true);

    dispatch(fetchAccessCard(accessCardId, accessCardCode));
  };

  useEffect(() => {
    if (loading && accessCardData && accessCardData.access_ids[accessCardId]) {
      const accessCardObject = accessCardData.access_ids[accessCardId];
      if (accessCardObject) {
        childSelected(accessCardObject);
      } else {
        console.error("Access Card not found");
      }

      setIsSubmitting(false);
      setCustomizePopup(null);
      setPopupLoading(false);
    }
    else if (accessCardError) {
      toast.dismiss();
      toast.error(
        <>
          <span className="formSuccessMsg">{accessCardError}</span>
        </>,
        {
          position: "top-center"
        }
      );
      setPopupLoading(false);
    }
  }, [accessCardData, loading, isSubmitting]);

  const divPrintAreaRef = useRef(null);
  const divProductDetailsOverviewSection = useRef(null);
  const iframePrintAreaRef = useRef(null);
  const [dimensionsPrintArea, setDimensions] = useState({
    width: 0,
    height: 0
  });

  useEffect(() => {
    // Calculate the dimensions of divA after the component has mounted
    const handleResize = () => {
      if (divProductDetailsOverviewSection.current) {
        const { offsetWidth, offsetHeight } =
          divProductDetailsOverviewSection.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    // Adjust the iframe scaling based on the dimensions of divA
    if (iframePrintAreaRef.current) {
      const iframeDoc = iframePrintAreaRef.current.contentWindow.document;
      const iframeBody = iframeDoc.body;

      const iframeWidth = iframeBody.scrollWidth;
      const iframeHeight = iframeBody.scrollHeight;

      const widthScale = dimensionsPrintArea.width / iframeWidth;
      const heightScale = dimensionsPrintArea.height / iframeHeight;
      const scale = Math.min(widthScale, heightScale);

      iframeBody.style.transformOrigin = "0 0";
      iframeBody.style.transform = `scale(${scale})`;
      iframeBody.style.width = `${iframeWidth}px`;
      iframeBody.style.height = `${iframeHeight}px`;
      iframeBody.style.overflow = "hidden";

      iframeBody.style.marginLeft = `${(dimensionsPrintArea.width - iframeWidth * scale) / 2}px`;
    }
  }, [dimensionsPrintArea]);

  const containerHeight = () =>
    windowSize.height > 944 ? `calc(${windowSize.height}px - 138px)` : "100%";

  const listRef=useRef(null);
  const handleClickOutside = (event) => {
    if (listRef.current && !listRef.current.contains(event.target)) {
      setOpenList(false);
    }
  };

  // Attach and clean up the event listener
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleOutside(e){
    e.stopPropagation();
  }
  return (
    <section className="productDetails">
      <div
        className="productDetailsContainer"
        style={{ height: containerHeight() }}
      >
        <div className="productDetailsOverview">
          {isMobile && (
            <Subtitle
              onClick={() => navigate("/parents/home")}
              title={t("productDetails.goBack")}
            />
          )}
          {isMobile && (
            <div className="currentOffers">
              <div className="currentOffersCards">
                <Splide
                  options={{ ...currentOffersMobileSlide, height: "auto" }}
                >
                  {offers.map((data) => (
                    <SplideSlide key={data.id}>
                      <OfferCard
                        offerData={data}
                        miniCard={true}
                        viewOffer={false}
                        lineSize={20}
                      />
                    </SplideSlide>
                  ))}
                </Splide>
              </div>
            </div>
          )}
          <div className="productDetailsOverviewHead">
          <div className="childList" ref={listRef} onClick={handleOutside}>
              <div onClick={selectList} className="selectedChild">
                <div className="selectedChildDetails">
                  <span className="previewImg">
                    {/* <img
                      src={ChildPreviewImg}
                      alt={!selectedChild?.name && "ChildPreviewImg"}
                      style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                    /> */}
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        backgroundImage: `url(${ChildPreviewImg})`
                      }}
                      className="imageContainer"
                    ></div>
                  </span>
                  <div className="selectedChildDetailsName">
                    <span>{selectedChild.id}</span>
                    <p>{selectedChild.name}</p>
                  </div>
                </div>
                <img src={Arrow} alt="Arrow" />
              </div>
              {openList && accessCardData && (
                <div className="childListDetails">
                  {Object.keys(accessCardData?.access_ids).map((key) => {
                    const data = accessCardData?.access_ids[key];
                    return (
                      <div
                        key={data.id}
                        onClick={() => childSelected(data)}
                        className="childListDetailsCard"
                      >
                        <span className="previewImg">
                          {/* <div style="background-position: top center !important;-ms-transform: rotate(0deg);transform: rotate(0deg);-webkit-transform: rotate(0deg); -ms-transform-origin: 0 0; transform-origin: 0 0;-webkit-transform-origin: 0 0;border: soild 1px grey;width:32px;height:32px;background-image: url({accessCardData?.access_ids[key]?.summary
                                ?.image_url});background-size:cover;background-repeat: no-repeat;background-position: center center;border-radius:50%;"></div> */}
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              backgroundImage: `url(${accessCardData?.access_ids[key]?.summary
                                ?.image_url
                                })`
                            }}
                            className="imageContainer"
                          ></div>
                          {/* <img
                            src={
                              accessCardData?.access_ids[key]?.summary
                                ?.image_url
                            }
                            alt="ChildPreviewImg"
                          /> */}
                        </span>
                        <div className="selectedChildDetailsName">
                          <span>
                            {accessCardData?.access_ids[key]?.summary.access_id}
                          </span>
                          <p>
                            {
                              accessCardData?.access_ids[key]?.summary
                                .album_name
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <button className="childListDetailsAdd" onClick={addNewCard}>
                    <img src={PlusIcon} alt="PlusIcon" />{" "}
                    {t("productDetails.addAccessCard")}
                  </button>
                </div>
              )}
            </div>
            <span className="dividerLine">
              <img src={DividerLine} alt="DividerLine" />
            </span>


            <div className="previewImages">
              <Splide options={{ ...previewImagesSlide, height: "auto" }}>
                {album?.photos?.map((data) => (
                  <SplideSlide key={data.id}>
                    <span onClick={() => topOverview(data.id)}>
                      <img
                        className={`${Number(topPreview) === data.id ? "imageActive" : ""} `}
                        src={data?.thumbnail_url}
                        alt="ChildImg"
                      />
                      <p>{data.name}</p>
                    </span>
                  </SplideSlide>
                ))}
              </Splide>
            </div>
          </div>
          <div
            ref={divProductDetailsOverviewSection}
            className="productDetailsOverviewSection"
          >
            {!isMobile ? (
              overviewBoxes.length > 6 ?
                <div className="overviewList">
                  <Splide options={{ ...overViewListSlide, height: "520px" }}>
                    {overviewBoxes.map((data) => (
                      <SplideSlide key={data.id}>
                        <div
                          onClick={() => sideOverviewBox(data.id)}
                          className={`overviewListCard ${sidePreview === data.id ? "overviewListCardActive" : ""}`}
                        >
                          <span>
                            <img src={data.title.toLowerCase().includes("pack") ? data.icon : "https://cdn-icons-png.flaticon.com/128/4302/4302871.png"} alt="OverviewBoxIcon" />
                          </span>
                          <p data-tooltip-id="packageInfo" data-tooltip-content={data.title}>{data.title.length > 10 ? data.title.slice(0, 10) + "..." : data.title}</p>
                        </div>
                      </SplideSlide>
                    ))}
                  </Splide>
                  <Tooltip id="packageInfo" className="package-tooltip" place="right" />
                </div>
                :
                <div className="overviewList">
                  {overviewBoxes.map((data) => (
                    <div
                      onClick={() => sideOverviewBox(data.id)}
                      className={`overviewListCard ${sidePreview === data.id ? "overviewListCardActive" : ""}`}
                      key={data.id}
                    >
                      <span>
                        <img src={data.title.toLowerCase().includes("pack") ? data.icon : "https://cdn-icons-png.flaticon.com/128/4302/4302871.png"} alt="OverviewBoxIcon" />
                      </span>
                      <p data-tooltip-id="packageInfo" data-tooltip-content={data.title}>{data.title.length > 10 ? data.title.slice(0, 10) + "..." : data.title}</p>
                    </div>
                  ))}
                  <Tooltip id="packageInfo" className="package-tooltip" place="bottom" />
                </div>
            ) : (
              <div className="overviewList">
                {overviewBoxes.map((data) => (
                  <div
                    onClick={() => sideOverviewBox(data.id)}
                    key={data.id}
                    className={`overviewListCard ${sidePreview === data.id ? "overviewListCardActive" : ""}`}
                  >
                    <span>
                      <img src={data.title.toLowerCase().includes("pack") ? data.icon : "https://cdn-icons-png.flaticon.com/128/4302/4302871.png"} alt="OverviewBoxIcon" />
                    </span>
                    <p>{data.title}</p>
                  </div>
                ))}
              </div>
            )}

            <div
              ref={divPrintAreaRef}
              className="clear_printarea"
              style={{ width: "100%", height: "100%", overflow: "hidden" }}
            >
              {activeImg ? (
                <iframe
                  ref={iframePrintAreaRef}
                  src={activeImg}
                  title="External Content"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    overflow: "hidden",
                    display: isLoading[activeImg] ? "none" : "block"
                  }}
                  onLoad={() => handleLoad(activeImg)}
                />
              ) : (
                <Spinner />
              )}
              {isLoading[activeImg] && <Spinner />}
            </div>
          </div>
        </div>
        <div className="productDetailsPackage">
          <div
            className="choosePackage"
            style={{
              height:
                windowSize.height > 944
                  ? `calc(100% - ${availOffer?.current?.clientHeight}px)`
                  : ""
            }}
          >
            <h4 className="productDetailsPackageTitle">
              {t("productDetails.choosePackage")}
            </h4>
            <div className="choosePackageList">
              {packagesData?.map((data) => {
                return (
                  <Fragment key={data?.id}>
                    <Tooltip id="explanation" place="left" className="custom-tooltip" />
                    <PackageCard
                      source="products"
                      openCustom={() => openCustomPopup("childData")}
                      key={data?.id}
                      data={data}
                      onClick={() => handleClickCard(data)}
                      activeCard={activePackageCard}
                    // eventUser={eventUser}
                    />
                  </Fragment>
                );
              })}
            </div>
          </div>
          {!isMobile && offers.length > 0 && (
            <div className="currentOffers" ref={availOffer}>
              <h4 className="productDetailsPackageTitle">
                {t("home.offers")}(<b>{offers.length}</b>)
              </h4>


              {!loggedIn && (
                <div className="offerLoginApply">
                  <button
                    className="loginToApplyOfferButton"
                    onClick={() => navigate("/parents/login")}
                  >
                    {t("info.loginToApplyOffer")}
                  </button>
                </div>
              )}

              <div className="currentOffersCards">
                <Splide
                  options={{
                    rewind: false,
                    perPage: 2,
                    gap: 10,
                    height: "auto"
                  }}
                >
                  {offers.map((data) => (
                    <SplideSlide key={data.id}>
                      <OfferCard
                        offerData={data}
                        miniCard={true}
                        viewOffer={false}
                        lineSize={30}
                      />
                    </SplideSlide>
                  ))}
                </Splide>
              </div>
            </div>
          )}
        </div>
      </div>
      <Checkout />
      {customizePopup === "childData" && (
        <CustomPopup
          customizePopup={() => openCustomPopup("childData")}
          setCustomizePopup={setCustomizePopup}
        />
      )}

      {customizePopup === "addCard" && (
        <Popup
          open="true"
          close={() => setCustomizePopup(!customizePopup)}
          title={t("home.addAccessBtn")}
          contentClassName="addCard"
        >
          <>
            <form onSubmit={handleSubmit}>
              <div className="input">
                <Input
                  id="accessId"
                  placeholderText={t("accessScreen.accessId")}
                  icon={accessId}
                  type="text"
                  name="accessId"
                  value={accessCardId}
                  onChange={handleInputChange}
                  error={accessCardErrors.accessId}
                />
                <Input
                  id="accessCode"
                  placeholderText={t("accessScreen.accessCode")}
                  icon={accessCode}
                  type="text"
                  name="accessCode"
                  value={accessCardCode}
                  onChange={handleInputChange}
                  error={accessCardErrors.accessCode}
                />
              </div>

              <div className="loginButton kidsButton">
                <Button
                  type="submit"
                  disabled={isSubmitting || !accessCardId || !accessCardCode}
                >
                  {popupLoading && <Spinner className="absolute" style={{ marginRight: 10 }} />}{" "}
                  {t("accessScreen.addAccessCard")}
                </Button>
              </div>
            </form>
          </>
        </Popup>
      )}
    </section>
  );
};

export default ProductDetails;
