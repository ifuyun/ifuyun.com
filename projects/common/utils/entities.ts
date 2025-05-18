export interface EntitiesMap {
  [name: string]: string;
}

const entityRegExp = /&#([a-z0-9]+);?|&([a-z0-9]+);/gi;
const asciiMap: Record<number, string> = {
  128: '\u20AC',
  130: '\u201A',
  131: '\u0192',
  132: '\u201E',
  133: '\u2026',
  134: '\u2020',
  135: '\u2021',
  136: '\u02C6',
  137: '\u2030',
  138: '\u0160',
  139: '\u2039',
  140: '\u0152',
  142: '\u017D',
  145: '\u2018',
  146: '\u2019',
  147: '\u201C',
  148: '\u201D',
  149: '\u2022',
  150: '\u2013',
  151: '\u2014',
  152: '\u02DC',
  153: '\u2122',
  154: '\u0161',
  155: '\u203A',
  156: '\u0153',
  158: '\u017E',
  159: '\u0178'
};
// Raw entities
const baseEntities: EntitiesMap = {
  '"': '&quot;', // Needs to be escaped since the YUI compressor would otherwise break the code
  "'": '&#39;',
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '\u0060': '&#96;'
};
// Reverse lookup table for raw entities
const reverseEntities: EntitiesMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&apos;': `'`
};

// Build a two-way lookup table for the entities
export function buildEntitiesLookup(items: string | undefined, radix?: number): EntitiesMap | undefined {
  const lookup: Record<string, string> = {};

  if (items) {
    const itemList = items.split(',');
    radix = radix || 10;

    // Build entities lookup table
    for (let i = 0; i < itemList.length; i += 2) {
      const chr = String.fromCharCode(parseInt(itemList[i], radix));

      // Only add non-base entities
      if (!baseEntities[chr]) {
        const entity = '&' + itemList[i + 1] + ';';
        lookup[chr] = entity;
        lookup[entity] = chr;
      }
    }

    return lookup;
  }
  return undefined;
}

const entityList = [
  '50,nbsp,51,iexcl,52,cent,53,pound,54,curren,55,yen,56,brvbar,57,sect,58,uml,59,copy,',
  '5a,ordf,5b,laquo,5c,not,5d,shy,5e,reg,5f,macr,5g,deg,5h,plusmn,5i,sup2,5j,sup3,5k,acute,',
  '5l,micro,5m,para,5n,middot,5o,cedil,5p,sup1,5q,ordm,5r,raquo,5s,frac14,5t,frac12,5u,frac34,',
  '5v,iquest,60,Agrave,61,Aacute,62,Acirc,63,Atilde,64,Auml,65,Aring,66,AElig,67,Ccedil,',
  '68,Egrave,69,Eacute,6a,Ecirc,6b,Euml,6c,Igrave,6d,Iacute,6e,Icirc,6f,Iuml,6g,ETH,6h,Ntilde,',
  '6i,Ograve,6j,Oacute,6k,Ocirc,6l,Otilde,6m,Ouml,6n,times,6o,Oslash,6p,Ugrave,6q,Uacute,',
  '6r,Ucirc,6s,Uuml,6t,Yacute,6u,THORN,6v,szlig,70,agrave,71,aacute,72,acirc,73,atilde,74,auml,',
  '75,aring,76,aelig,77,ccedil,78,egrave,79,eacute,7a,ecirc,7b,euml,7c,igrave,7d,iacute,7e,icirc,',
  '7f,iuml,7g,eth,7h,ntilde,7i,ograve,7j,oacute,7k,ocirc,7l,otilde,7m,ouml,7n,divide,7o,oslash,',
  '7p,ugrave,7q,uacute,7r,ucirc,7s,uuml,7t,yacute,7u,thorn,7v,yuml,ci,fnof,sh,Alpha,si,Beta,',
  'sj,Gamma,sk,Delta,sl,Epsilon,sm,Zeta,sn,Eta,so,Theta,sp,Iota,sq,Kappa,sr,Lambda,ss,Mu,',
  'st,Nu,su,Xi,sv,Omicron,t0,Pi,t1,Rho,t3,Sigma,t4,Tau,t5,Upsilon,t6,Phi,t7,Chi,t8,Psi,',
  't9,Omega,th,alpha,ti,beta,tj,gamma,tk,delta,tl,epsilon,tm,zeta,tn,eta,to,theta,tp,iota,',
  'tq,kappa,tr,lambda,ts,mu,tt,nu,tu,xi,tv,omicron,u0,pi,u1,rho,u2,sigmaf,u3,sigma,u4,tau,',
  'u5,upsilon,u6,phi,u7,chi,u8,psi,u9,omega,uh,thetasym,ui,upsih,um,piv,812,bull,816,hellip,',
  '81i,prime,81j,Prime,81u,oline,824,frasl,88o,weierp,88h,image,88s,real,892,trade,89l,alefsym,',
  '8cg,larr,8ch,uarr,8ci,rarr,8cj,darr,8ck,harr,8dl,crarr,8eg,lArr,8eh,uArr,8ei,rArr,8ej,dArr,',
  '8ek,hArr,8g0,forall,8g2,part,8g3,exist,8g5,empty,8g7,nabla,8g8,isin,8g9,notin,8gb,ni,8gf,prod,',
  '8gh,sum,8gi,minus,8gn,lowast,8gq,radic,8gt,prop,8gu,infin,8h0,ang,8h7,and,8h8,or,8h9,cap,8ha,cup,',
  '8hb,int,8hk,there4,8hs,sim,8i5,cong,8i8,asymp,8j0,ne,8j1,equiv,8j4,le,8j5,ge,8k2,sub,8k3,sup,8k4,',
  'nsub,8k6,sube,8k7,supe,8kl,oplus,8kn,otimes,8l5,perp,8m5,sdot,8o8,lceil,8o9,rceil,8oa,lfloor,8ob,',
  'rfloor,8p9,lang,8pa,rang,9ea,loz,9j0,spades,9j3,clubs,9j5,hearts,9j6,diams,ai,OElig,aj,oelig,b0,',
  'Scaron,b1,scaron,bo,Yuml,m6,circ,ms,tilde,802,ensp,803,emsp,809,thinsp,80c,zwnj,80d,zwj,80e,lrm,',
  '80f,rlm,80j,ndash,80k,mdash,80o,lsquo,80p,rsquo,80q,sbquo,80s,ldquo,80t,rdquo,80u,bdquo,810,dagger,',
  '811,Dagger,81g,permil,81p,lsaquo,81q,rsaquo,85c,euro'
];
// Unpack entities lookup where the numbers are in radix 32 to reduce the size
const namedEntities = buildEntitiesLookup(entityList.join(''), 32) as EntitiesMap;

/**
 * Decodes the specified string, this will replace entities with raw UTF characters.
 *
 * @method decodeEntities
 * @param {String} text Text to entity decode.
 * @return {String} Entity decoded string.
 */
export function decodeEntities(text: string): string {
  return text.replace(entityRegExp, (all, numericStr: string) => {
    if (numericStr) {
      let numeric: number;
      if (numericStr.charAt(0).toLowerCase() === 'x') {
        numeric = parseInt(numericStr.substring(1), 16);
      } else {
        numeric = parseInt(numericStr, 10);
      }

      // Support upper UTF
      if (numeric > 0xffff) {
        numeric -= 0x10000;

        return String.fromCharCode(0xd800 + (numeric >> 10), 0xdc00 + (numeric & 0x3ff));
      }

      return asciiMap[numeric] || String.fromCharCode(numeric);
    }

    return reverseEntities[all] || namedEntities[all];
  });
}
