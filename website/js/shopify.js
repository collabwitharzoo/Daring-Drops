/* Daring Drops — Shopify Storefront API Wrapper */

const ShopifyAPI = (() => {
  function getEndpoint() {
    return `https://${DD_CONFIG.shopDomain}/api/2024-01/graphql.json`;
  }

  async function fetch(query, variables = {}) {
    const res = await window.fetch(getEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': DD_CONFIG.storefrontToken
      },
      body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    if (json.errors) {
      console.error('Shopify API errors:', json.errors);
      throw new Error(json.errors[0].message);
    }
    return json.data;
  }

  // ── Product fragment ──
  const PRODUCT_FRAGMENT = `
    fragment ProductFields on Product {
      id
      title
      handle
      description
      tags
      collections(first: 1) {
        edges { node { title handle } }
      }
      priceRange {
        minVariantPrice { amount currencyCode }
      }
      compareAtPriceRange {
        minVariantPrice { amount currencyCode }
      }
      images(first: 10) {
        edges { node { url altText } }
      }
      variants(first: 20) {
        edges {
          node {
            id
            title
            availableForSale
            priceV2 { amount currencyCode }
            compareAtPriceV2 { amount currencyCode }
            selectedOptions { name value }
          }
        }
      }
    }
  `;

  // ── Fetch all products (with optional collection filter & cursor) ──
  async function fetchAllProducts(collectionHandle = null, cursor = null) {
    if (collectionHandle) {
      const data = await fetch(`
        ${PRODUCT_FRAGMENT}
        query GetCollectionProducts($handle: String!, $cursor: String) {
          collectionByHandle(handle: $handle) {
            title
            products(first: 12, after: $cursor) {
              pageInfo { hasNextPage endCursor }
              edges { node { ...ProductFields } }
            }
          }
        }
      `, { handle: collectionHandle, cursor });

      const col = data?.collectionByHandle;
      if (!col) return { products: [], hasNextPage: false, cursor: null };
      return {
        products: col.products.edges.map(e => e.node),
        hasNextPage: col.products.pageInfo.hasNextPage,
        cursor: col.products.pageInfo.endCursor
      };
    } else {
      const data = await fetch(`
        ${PRODUCT_FRAGMENT}
        query GetAllProducts($cursor: String) {
          products(first: 12, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            edges { node { ...ProductFields } }
          }
        }
      `, { cursor });

      return {
        products: data.products.edges.map(e => e.node),
        hasNextPage: data.products.pageInfo.hasNextPage,
        cursor: data.products.pageInfo.endCursor
      };
    }
  }

  // ── Fetch single product by handle ──
  async function fetchProductByHandle(handle) {
    const data = await fetch(`
      ${PRODUCT_FRAGMENT}
      query GetProduct($handle: String!) {
        productByHandle(handle: $handle) { ...ProductFields }
      }
    `, { handle });
    return data?.productByHandle || null;
  }

  // ── Fetch collections ──
  async function fetchCollections() {
    const data = await fetch(`
      query GetCollections {
        collections(first: 10) {
          edges {
            node { id title handle image { url } }
          }
        }
      }
    `);
    return data?.collections?.edges?.map(e => e.node) || [];
  }

  // ── Cart (Shopify Cart API — newer, uses cartCreate) ──
  const CART_FRAGMENT = `
    fragment CartFields on Cart {
      id
      checkoutUrl
      totalQuantity
      cost {
        subtotalAmount { amount currencyCode }
        totalAmount { amount currencyCode }
      }
      lines(first: 50) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                priceV2 { amount currencyCode }
                product {
                  title handle
                  images(first: 1) { edges { node { url altText } } }
                }
              }
            }
          }
        }
      }
    }
  `;

  async function createCart(lines = []) {
    const data = await fetch(`
      ${CART_FRAGMENT}
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
    `, { input: { lines } });
    if (data?.cartCreate?.userErrors?.length) {
      throw new Error(data.cartCreate.userErrors[0].message);
    }
    return data?.cartCreate?.cart;
  }

  async function addCartLines(cartId, lines) {
    const data = await fetch(`
      ${CART_FRAGMENT}
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
    `, { cartId, lines });
    if (data?.cartLinesAdd?.userErrors?.length) {
      throw new Error(data.cartLinesAdd.userErrors[0].message);
    }
    return data?.cartLinesAdd?.cart;
  }

  async function updateCartLines(cartId, lines) {
    const data = await fetch(`
      ${CART_FRAGMENT}
      mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
    `, { cartId, lines });
    return data?.cartLinesUpdate?.cart;
  }

  async function removeCartLines(cartId, lineIds) {
    const data = await fetch(`
      ${CART_FRAGMENT}
      mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
    `, { cartId, lineIds });
    return data?.cartLinesRemove?.cart;
  }

  async function fetchCart(cartId) {
    const data = await fetch(`
      ${CART_FRAGMENT}
      query GetCart($cartId: ID!) {
        cart(id: $cartId) { ...CartFields }
      }
    `, { cartId });
    return data?.cart || null;
  }

  return {
    fetchAllProducts,
    fetchProductByHandle,
    fetchCollections,
    createCart,
    addCartLines,
    updateCartLines,
    removeCartLines,
    fetchCart
  };
})();

window.ShopifyAPI = ShopifyAPI;
